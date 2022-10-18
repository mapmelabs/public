function publish() {
    const config = retrieveConfig()
    const sessionToken = getSessionToken(config.apiKey)

    const options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
            authorization: `Bearer ${sessionToken}`,
        },
    }

    UrlFetchApp.fetch(`https://api.mapme.com/api/scenes/${config.sceneId}`, options)
}
