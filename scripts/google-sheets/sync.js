class Map {
    constructor(sheetName) {
        this.sheetName = sheetName
        const config = retrieveConfig()
        this.sceneId = config.sceneId
        this.sessionToken = getSessionToken(config.apiKey)
    }

    addSection(row) {
        const [
            ,
            status,
            shouldDelete,
            id,
            name,
            description,
            categories,
            address,
            latitude,
            longitude,
            pitch,
            zoom,
            bearing,
            actionText,
            actionUrl,
            media,
        ] = row

        const data = {
            sectionData: {
                id: Utilities.getUuid(),
                name,
                description,
                address,
                mapView: {
                    center: {
                        lat: latitude,
                        lng: longitude,
                    },
                    zoom,
                    bearing,
                    pitch,
                    // 'centerZoom' | 'bounds' | 'autofit'
                    mode: 'centerZoom',
                },
                callToAction: {
                    url: actionUrl,
                    title: actionText,
                    // '_modal' | '_self'
                    // target: "_modal"
                },
            },
            sceneId: this.sceneId,
            categoryIds: [],
        }

        const options = {
            method: 'post',
            contentType: 'application/json',
            headers: {
                authorization: `Bearer ${this.sessionToken}`,
            },
            payload: JSON.stringify(data),
        }
        UrlFetchApp.fetch('https://api.mapme.com/api/sections', options)
    }

    sync() {
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.sheetName)
        const table = sheet.getDataRange().getValues()

        const VALUES_START_ROW = 5
        const STATUS_COLUMN = 2
        const ERROR_COLUMN = 17

        const values = table.slice(VALUES_START_ROW)

        for (const i in values) {
            const value = values[i]
            const [, status] = value
            if (status === 'new') {
                const row = VALUES_START_ROW + 1 + parseInt(i)
                const statusCell = sheet.getRange(row, STATUS_COLUMN)

                try {
                    this.addSection(value)
                    statusCell.setValue('sync')
                } catch (e) {
                    statusCell.setValue('error')
                    const errorCell = sheet.getRange(row, ERROR_COLUMN)
                    errorCell.setValue(e.message)
                }
            }
        }
    }
}

function sync() {
    const map = new Map('ADD or SYNC')
    map.sync()
}
