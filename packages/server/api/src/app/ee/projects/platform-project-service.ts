import {
    UpdateProjectPlatformRequest,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    Cursor,
    ErrorCode,
    FlowStatus,
    isNil,
    PlatformId,
    Project,
    ProjectId,
    ProjectWithLimits,
    SeekPage,
    spreadIfDefined,
    UserStatus,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager, Equal, ILike, In, IsNull } from 'typeorm'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { repoFactory } from '../../core/db/repo-factory'
import { transaction } from '../../core/db/transaction'
import { flowService } from '../../flows/flow/flow.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'
import { ProjectEntity } from '../../project/project-entity'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { platformUsageService } from '../platform/platform-usage-service'
import { platformProjectSideEffects } from './platform-project-side-effects'
import { ProjectMemberEntity } from './project-members/project-member.entity'
import { projectLimitsService } from './project-plan/project-plan.service'
const projectRepo = repoFactory(ProjectEntity)
const projectMemberRepo = repoFactory(ProjectMemberEntity)

export const platformProjectService = (log: FastifyBaseLogger) => ({
    async getAllForPlatform(params: GetAllForParamsAndUser): Promise<SeekPage<ProjectWithLimits>> {
        const user = await userService.getOneOrFail({
            id: params.userId,
        })
        assertNotNullOrUndefined(user.platformId, 'platformId is undefined')
        const projects = await projectService.getAllForUser({
            platformId: user.platformId,
            userId: params.userId,
            displayName: params.displayName,
        })
        return getProjects({
            ...params,
            projectIds: projects.map((project) => project.id),
        }, log)
    },
    async update({
        projectId,
        request,
    }: UpdateParams): Promise<ProjectWithLimits> {
        await projectService.update(projectId, request)
        if (!isNil(request.plan)) {
            const project = await projectService.getOneOrThrow(projectId)
            const platform = await platformService.getOneWithPlanOrThrow(project.platformId)
            if (platform.plan.manageProjectsEnabled) {
                await projectLimitsService(log).upsert(
                    {
                        ...spreadIfDefined('pieces', request.plan.pieces),
                        ...spreadIfDefined('piecesFilterType', request.plan.piecesFilterType),
                        tasks: request.plan.tasks ?? null,
                        aiCredits: request.plan.aiCredits ?? null,
                    },
                    projectId,
                )
            }
        }
        return this.getWithPlanAndUsageOrThrow(projectId)
    },
    async getWithPlanAndUsageOrThrow(
        projectId: string,
    ): Promise<ProjectWithLimits> {
        return enrichProject(
            await projectRepo().findOneByOrFail({
                id: projectId,
                deleted: IsNull(),
            }),
            log,
        )
    },

    async softDelete({ id, platformId }: SoftDeleteParams): Promise<void> {
        await transaction(async (entityManager) => {
            await assertAllProjectFlowsAreDisabled({
                projectId: id,
                entityManager,
            }, log)

            await softDeleteOrThrow({
                id,
                platformId,
                entityManager,
            })

            await platformProjectSideEffects(log).onSoftDelete({
                id,
            })
        })
    },

    async hardDelete({ id }: HardDeleteParams): Promise<void> {
        await projectRepo().delete({
            id,
        })
        await appConnectionService(log).deleteAllProjectConnections(id)
    },
})

async function getProjects(params: GetAllParams & { projectIds?: string[] }, log: FastifyBaseLogger): Promise<SeekPage<ProjectWithLimits>> {
    const { cursorRequest, limit, platformId, displayName, externalId, projectIds } = params
    const decodedCursor = paginationHelper.decodeCursor(cursorRequest)
    const paginator = buildPaginator({
        entity: ProjectEntity,
        query: {
            limit,
            order: 'ASC',
            afterCursor: decodedCursor.nextCursor,
            beforeCursor: decodedCursor.previousCursor,
        },
    })
    const displayNameFilter = displayName ? ILike(`%${displayName}%`) : undefined
    const filters = {
        platformId: Equal(platformId),
        deleted: IsNull(),
        ...spreadIfDefined('externalId', externalId),
        ...spreadIfDefined('displayName', displayNameFilter),
        ...(projectIds ? { id: In(projectIds) } : {}),
    }

    const queryBuilder = projectRepo()
        .createQueryBuilder('project')
        .leftJoinAndMapOne(
            'project.plan',
            'project_plan',
            'project_plan',
            'project.id = "project_plan"."projectId"',
        )
        .where(filters)
        .groupBy('project.id')
        .addGroupBy('"project_plan"."id"')

    const { data, cursor } = await paginator.paginate(queryBuilder)
    const projects: ProjectWithLimits[] = await Promise.all(
        data.map((project) => enrichProject(project, log)),
    )
    return paginationHelper.createPage<ProjectWithLimits>(projects, cursor)
}

type GetAllForParamsAndUser = {
    userId: string
} & GetAllParams

type GetAllParams = {
    platformId: string
    displayName?: string
    externalId?: string
    cursorRequest: Cursor | null
    limit: number
}

async function enrichProject(
    project: Project,
    log: FastifyBaseLogger,
): Promise<ProjectWithLimits> {
    const totalUsers = await projectMemberRepo().countBy({
        projectId: project.id,
    })
    const activeUsers = await projectMemberRepo()
        .createQueryBuilder('project_member')
        .leftJoin('user', 'user', 'user.id = project_member."userId"')
        .groupBy('user.id')
        .where('user.status = :activeStatus and project_member."projectId" = :projectId', {
            activeStatus: UserStatus.ACTIVE,
            projectId: project.id,
        })
        .getCount()

    const totalFlows = await flowService(log).count({
        projectId: project.id,
    })

    const activeFlows = await flowService(log).count({
        projectId: project.id,
        status: FlowStatus.ENABLED,
    })


    const platformBilling = await platformPlanService(log).getOrCreateForPlatform(project.platformId)

    const { startDate, endDate } = await platformPlanService(system.globalLogger()).getBillingDates(platformBilling)
    const projectTasksUsage = await platformUsageService(log).getProjectUsage({ projectId: project.id, metric: 'tasks', startDate, endDate })
    const projectAICreditUsage = await platformUsageService(log).getProjectUsage({ projectId: project.id, metric: 'ai_credits', startDate, endDate })
    return {
        ...project,
        plan: await projectLimitsService(log).getPlanWithPlatformLimits(
            project.id,
        ),
        usage: {
            aiCredits: projectAICreditUsage,
            tasks: projectTasksUsage,
            nextLimitResetDate: endDate,
        },
        analytics: {
            activeFlows,
            totalFlows,
            totalUsers,
            activeUsers,
        },
    }
}

const assertAllProjectFlowsAreDisabled = async (
    params: AssertAllProjectFlowsAreDisabledParams,
    log: FastifyBaseLogger,
): Promise<void> => {
    const { projectId, entityManager } = params

    const projectHasEnabledFlows = await flowService(log).existsByProjectAndStatus({
        projectId,
        status: FlowStatus.ENABLED,
        entityManager,
    })

    if (projectHasEnabledFlows) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: 'PROJECT_HAS_ENABLED_FLOWS',
            },
        })
    }
}

const softDeleteOrThrow = async ({
    id,
    platformId,
    entityManager,
}: SoftDeleteOrThrowParams): Promise<void> => {
    const deleteResult = await projectRepo(entityManager).softDelete({
        id,
        platformId,
        deleted: IsNull(),
    })

    if (deleteResult.affected !== 1) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: id,
                entityType: 'project',
            },
        })
    }
}

type UpdateParams = {
    projectId: ProjectId
    request: UpdateProjectPlatformRequest
    platformId?: PlatformId
}

type SoftDeleteParams = {
    id: ProjectId
    platformId: PlatformId
}

type SoftDeleteOrThrowParams = SoftDeleteParams & {
    entityManager: EntityManager
}

type AssertAllProjectFlowsAreDisabledParams = {
    projectId: ProjectId
    entityManager: EntityManager
}

type HardDeleteParams = {
    id: ProjectId
}
