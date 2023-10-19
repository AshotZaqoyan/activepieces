import tinycolor from 'tinycolor2'

function generateColors(hex: string) {
    const baseLight = tinycolor('#ffffff')
    const baseDark = tinycolor(hex).toHex()
    const baseTriad = tinycolor(hex).tetrad()

    return {
        '50': tinycolor.mix(baseLight, hex, 12).toHexString(),
        '100': tinycolor.mix(baseLight, hex, 30).toHexString(),
        '200': tinycolor.mix(baseLight, hex, 50).toHexString(),
        '300': tinycolor.mix(baseLight, hex, 70).toHexString(),
        '400': tinycolor.mix(baseLight, hex, 85).toHexString(),
        '500': tinycolor.mix(baseLight, hex, 100).toHexString(),
        '600': tinycolor.mix(baseDark, hex, 87).toHexString(),
        '700': tinycolor.mix(baseDark, hex, 70).toHexString(),
        '800': tinycolor.mix(baseDark, hex, 54).toHexString(),
        '900': tinycolor.mix(baseDark, hex, 25).toHexString(),
        A100: tinycolor.mix(baseDark, baseTriad[3], 15).saturate(80)
            .lighten(65).toHexString(),
        A200: tinycolor
            .mix(baseDark, baseTriad[3], 15)
            .saturate(80)
            .lighten(55).toHexString(),
        A400: tinycolor
            .mix(baseDark, baseTriad[3], 15)
            .saturate(100)
            .lighten(45).toHexString(),
        A700: tinycolor
            .mix(baseDark, baseTriad[3], 15)
            .saturate(100)
            .lighten(40).toHexString(),
        contrast: {
            '50': '#000000',
            '100': '#000000',
            '200': '#000000',
            '300': '#000000',
            '400': '#ffffff',
            '500': '#ffffff',
            '600': '#ffffff',
            '700': '#ffffff',
            '800': '#ffffff',
            '900': '#ffffff',
            A100: '#000000',
            A200: '#000000',
            A400: '#000000',
            A700: '#000000',
        },
    }
}


function generateColorVariations(defaultColor: string) {
    const defaultColorObj = tinycolor(defaultColor)

    const darkColor = defaultColorObj.darken(0.7 * 100)
    const lightColor = defaultColorObj.lighten(1.3 * 100)
    const mediumColor = defaultColorObj

    return {
        default: defaultColorObj.toHexString(),
        dark: darkColor.toHexString(),
        light: lightColor.toHexString(),
        medium: mediumColor.toHexString(),
    }
}

function generateLigherColor(defaultColor: string) {
    const defaultColorObj = tinycolor(defaultColor)
    const lightColor = defaultColorObj.lighten(1.2 * 100)
    return lightColor.toHexString()
}

function generateTheme({ primaryColor }: { primaryColor: string }) {
    return {
        colors: {
            avatar: '#515151',
            'blue-link': '#1890ff',
            danger: '#dc3545',
            'primary-color': generateColorVariations(primaryColor),
            'warn-color': {
                default: '#f78a3b',
                light: '#fff6e4',
                dark: '#cc8805',
            },
            'success-color': {
                default: '#14ae5c',
                light: '#3cad71',
            },
            'selection-color': generateLigherColor(primaryColor),
        },
        logos: {
            fullLogoUrl:
                'https://cdn.activepieces.com/brand/full-logo.svg',
            smallFullLogoUrl:
                'https://cdn.activepieces.com/brand/full-logo-small.svg',
            favIconUrl:
                'https://cdn.activepieces.com/brand/favicon.ico',
            logoIconUrl:
                'https://cdn.activepieces.com/brand/logo.svg',
        },
        materialPrimaryPalette: generateColors(primaryColor),
        materialWarnPalette: {
            '50': '#fbe7e9',
            '100': '#f5c2c7',
            '200': '#ee9aa2',
            '300': '#e7727d',
            '400': '#e15361',
            '500': '#dc3545',
            '600': '#d8303e',
            '700': '#d32836',
            '800': '#ce222e',
            '900': '#c5161f',
            A100: '#fff6f7',
            A200: '#ffc3c6',
            A400: '#ff9095',
            A700: '#ff777c',
            contrast: {
                '50': '#000000',
                '100': '#000000',
                '200': '#000000',
                '300': '#000000',
                '400': '#ffffff',
                '500': '#ffffff',
                '600': '#ffffff',
                '700': '#ffffff',
                '800': '#ffffff',
                '900': '#ffffff',
                A100: '#000000',
                A200: '#000000',
                A400: '#000000',
                A700: '#000000',
            },
        },
    }
}

export const theme = generateTheme({
    primaryColor: '#6e41e2',
})
