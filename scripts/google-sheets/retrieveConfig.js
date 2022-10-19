function retrieveConfig() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('config')

    const SCENE_ID_ROW = 1
    const API_KEY_ROW = 2
    const VALUE_COLUMN = 2

    const sceneId = sheet.getRange(SCENE_ID_ROW, VALUE_COLUMN)
    const apiKey = sheet.getRange(API_KEY_ROW, VALUE_COLUMN)

    return {
        sceneId: sceneId.getValue(),
        apiKey: apiKey.getValue(),
    }
}
