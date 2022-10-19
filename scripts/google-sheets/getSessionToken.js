function getSessionToken(apiKey) {
    const options = {
        method: 'post',
        contentType: 'application/json',
        headers: {
            'x-api-key': apiKey,
        },
    }
    const response = UrlFetchApp.fetch('https://api.mapme.com/auth/key', options)

    const parsedResponse = JSON.parse(response)
    return parsedResponse.sessionToken
}
