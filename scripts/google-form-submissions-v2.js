/**
 * Script parameters
 * API service URL (confirm working against correct stack)
 * API-KEY (generated via Editor, the user generating the key must be owner/member of account)
 * Scene ID
 * categoryNameToIdMap (minimum one entry, if exactly one category exists, it is auth-assigned)
 */
const apiServiceUrl = 'https://api.mapme.com'

const apiKey = '[api key generated in Editor]'

const sceneId = '[scene ID]'

const categoryNameToIdMap = {
    'Category A': 'category A ID',
    'Category B': 'category B ID',
    'Category C': 'category C ID',
}
const publishRequired = true
const publishDelaySec = 5 // enables google geocode to complete prior to publish

///////////////////////// no changes expected below, do not modify /////////////////////////

const createSectionRequestBodyGet = (name, address, description, categoryIds, websiteURL) => {
    const reqBody = {
        sceneId: sceneId,
        sectionData: {name, address, description},
        categoryIds: categoryIds,
    }
    if (websiteURL) {
        Object.assign(reqBody.sectionData, {
            callToAction: {
                url: websiteURL,
                title: 'More Info',
            },
        })
    }
    return reqBody
}

const isResponseSuccessful = response => [200, 201].includes(response.getResponseCode())

const baseHttpOptsGet = options =>
    Object.assign(
        {
            method: 'post',
            contentType: 'application/json',
            muteHttpExceptions: true,
        },
        options
    )

const apiPostRequest = (relativePath, options, requestDesc) => {
    const url = apiServiceUrl + '/' + relativePath
    Logger.log(`apiRequestSend url ${url}`)
    Logger.log(`apiRequestSend options ${JSON.stringify(options, null, 2)}`)
    const response = UrlFetchApp.fetch(url, baseHttpOptsGet(options))
    const responseBodyText = response.getContentText()
    if (isResponseSuccessful(response)) {
        Logger.log(`${requestDesc} request success`)
        return responseBodyText ? JSON.parse(responseBodyText) : {}
    } else {
        Logger.log(
            `${requestDesc} request failed; code: ${response.getResponseCode()} text: ${response.getContentText()}`
        )
        throw new Error(`apiRequestSend failed for ${requestDesc}, aborting`)
    }
}

let sessionToken
const accessTokenGet = () => {
    const body = apiPostRequest('auth/key', {headers: {'x-api-key': apiKey}}, 'accessTokenGet')
    Logger.log(`sessionToken: ${body.sessionToken}`)
    sessionToken = body.sessionToken
}

const authorizedHeadersGet = () => ({Authorization: `Bearer ${sessionToken}`})

let createdSectionId
const createSection = data => {
    Logger.log(`createSection data:\n${JSON.stringify(data, null, 2)}`)
    const body = apiPostRequest(
        'api/sections',
        {
            headers: authorizedHeadersGet(),
            payload: JSON.stringify(data),
        },
        'createSection'
    )
    createdSectionId = body.sectionId
}

const scenePublish = () => {
    apiPostRequest(
        `api/scenes/${sceneId}`,
        {
            headers: authorizedHeadersGet(),
        },
        'scenePublish'
    )
}

function onFormSubmit(event) {
    const formResponse = event['response']
    const formResponseItems = formResponse.getItemResponses()
    let name, address, description, websiteURL
    const allCatIds = Object.values(categoryNameToIdMap)
    let sectCatIds = allCatIds.length === 1 ? [allCatIds[0]] : []
    formResponseItems.forEach(itemResponse => {
        const response = itemResponse.getResponse()
        const title = itemResponse.getItem().getTitle()
        switch (title) {
            case 'Name':
                name = response
                break
            case 'Address':
                address = response
                break
            case 'Description':
                description = response
                break
            case 'Website URL':
                websiteURL = response
                break
            case 'Category':
                response.forEach(catName => {
                    const catId = categoryNameToIdMap[catName]
                    if (catId) {
                        sectCatIds.push(catId)
                    } else {
                        Logger.log(`error: cannot find category ID for category-name ${catName}`)
                    }
                })
                break
        }
    })

    Logger.log(`apiServiceUrl ${apiServiceUrl}`)
    accessTokenGet()
    createSection(createSectionRequestBodyGet(name, address, description, sectCatIds, websiteURL))

    if (publishRequired) {
        console.log(`publishing scene in ${publishDelaySec} seconds`)
        Utilities.sleep(publishDelaySec * 1000)
        scenePublish()
    }
    Logger.log(`created sectionId ${createdSectionId} successfully`)
}