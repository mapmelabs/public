/**
 * Script parameters:
 * API key (generated via Editor)
 * Map ID
 * Category names and IDs etc
 */

const apiServiceUrl = 'https://api.mapme.com'

const apiKey = '[API key]'

const sceneId = '[map ID]'

const categoryNameToIdMap = {
    'Category A': 'Category A ID',
    'Category B': 'Category B ID',
    'Category C': 'Category C ID',
}

const publishRequired = true
const publishDelaySec = 5 // delay to resolve address prior publish

const descFieldsList = [
    // combines description fields
    {field: 'formFieldName1', title: 'Description Title 1'},
    {field: 'formFieldName2', title: 'Description Title 2'},
]
const descInsertFieldTitle = true // adds above titles into description
const descHtmlElement = 'p' // html element to wrap field values

///////////////////////// no change expected below //////////////////////////////

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

const apiRequestSend = (relativePath, options, requestDesc) => {
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
    const body = apiRequestSend('auth/key', {headers: {'x-api-key': apiKey}}, 'accessTokenGet')
    Logger.log(`sessionToken: ${body.sessionToken}`)
    sessionToken = body.sessionToken
}

const authorizedHeadersGet = () => ({Authorization: `Bearer ${sessionToken}`})

let createdSectionId
const createSection = data => {
    Logger.log(`createSection data:\n${JSON.stringify(data, null, 2)}`)
    const body = apiRequestSend(
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
    apiRequestSend(
        `api/scenes/${sceneId}`,
        {
            headers: authorizedHeadersGet(),
            method: 'put',
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
    const throwDescriptionConflict = () => {
        throw new Error(`The 'description' and 'descriptionX' fields cannot be used at the same time`)
    }
    const descriptionFieldValues = {}
    const isCombinedDesc = () => Object.keys(descriptionFieldValues).length > 0
    formResponseItems.forEach(itemResponse => {
        const value = itemResponse.getResponse()
        const fieldTitle = itemResponse.getItem().getTitle()
        let handled
        switch (fieldTitle) {
            case 'Name':
                name = value
                handled = true
                break
            case 'Address':
                address = value
                handled = true
                break
            case 'Description':
                if (isCombinedDesc()) {
                    throwDescriptionConflict()
                }
                description = value
                handled = true
                break
            case 'Website URL':
                websiteURL = value
                handled = true
                break
            case 'Category':
                value.forEach(catName => {
                    const catId = categoryNameToIdMap[catName]
                    if (catId) {
                        sectCatIds.push(catId)
                        handled = true
                    } else {
                        throw new Error(`error: cannot find category ID for category-name ${catName}`)
                    }
                })
                break
        }
        if (!handled) {
            if (description) {
                throwDescriptionConflict()
            }
            const entry = descFieldsList.find(entry => entry.field === fieldTitle)
            if (entry) {
                descriptionFieldValues[fieldTitle] = descInsertFieldTitle
                    ? (entry.title || entry.key) + ': ' + value
                    : value
                handled = true
            }
        }
        if (!handled) {
            Logger.log(`unhandled field '${fieldTitle}' value '${value}'`)
        }
    })
    if (isCombinedDesc()) {
        description = descFieldsList
            .map(({field}) => {
                const value = descriptionFieldValues[field]
                if (value) {
                    return value
                } else {
                    Logger.log(`warning: combined description field ${field} unused`)
                }
            })
            .filter(x => x)
            .map(value => `<${descHtmlElement}>${value}</${descHtmlElement}>`)
            .join('\n')
        Logger.log(`combined description:\n${description}`)
    }
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
