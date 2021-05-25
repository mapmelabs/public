/**
 * Base API URL
 * Set X-API-KEY
 * Set STORY ID
 * Set body of mapping categories with ID
 */
const baseUrl = 'https://api.mapme.com/graphql'
const xApiKey = '[editorGeneratedKeyGoesHere]'
const storyId = '[storyId]'
const categoriesMapping = {
    "Category1-name": 'mapme-ID-of-category-1',
    "Category2-name": 'mapme-ID-of-category-2',
    "Category3-name": 'mapme-ID-of-category-3',
}
const publishRequired = false
const categoryId = ''
/**
 * On form submit event trigger function
 * @param {object} event - event of form submit
 */
function onFormSubmit(event) {
    const formResponse = event['response']
    const itemResponses = formResponse.getItemResponses()
    let name, address, description, categoriesNames, websiteURL
    let categories = categoryId ? "${categoryId}" : Array()
    for (let j = 0; j < itemResponses.length; j++) {
        const itemResponse = itemResponses[j]
        //   for(let itemResponse in itemResponses){
        const title = itemResponse.getItem().getTitle()
        let response = itemResponse.getResponse()
        if (typeof response === 'string') {
          response = response.replace(/\"/g, '\\\"')  
        }
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
                categoriesNames = response
                categoriesNames.forEach(x => categories.push(`"${categoriesMapping[x]}"`))
                categories = categories.join(',')
                break
        }
    }
    const body = createRequest(name, address, description, categories, websiteURL)  
    Logger.log(body)
    const method = 'post'
    getMapMeApi(method, body)
if (publishRequired) {
      console.log('publishing story')
      const body = publishStoryMapRequest()
      getMapMeApi(method, body)
    }    
}
/**
 * Create request body
 * @param {string} name - name of location
 * @param {string} address   - address of location
 * @param {string} description   - description of location
 * @param {string} categories    - categories of location
 * @param {string} websiteURL - action button URL
 * @return {string} body    - body of request
 */
function createRequest(name, address, description, categories, websiteURL) {
    var graphql = JSON.stringify({
        query: `mutation createSectionMutation {
        createSection(createSectionInputs: {
          storyId: "${storyId}"
          name: "${name}"
          address: "${address}"
          description: """${description}"""
          categoryIds: [${categories}]
          callToAction: {url: "${websiteURL}", title: "More Info"}
        }){
            id
          }
        }`,
    })
    return graphql
}

function publishStoryMapRequest() {
    var graphql = JSON.stringify({
        query: `
mutation publishStoryMap {
  publishStoryMap(storyId: "${storyId}"){storyId, publishId}
}
`,
    })
    return graphql
}

/**
 * Base request to MapMe API
 * @param {string} fullRequest  Full request URL to API
 * @param {string} method       HTTP method (POST,GET) to API
 * @param {object} orderObj     Object of request to send to API
 */
function getMapMeApi(method = 'get', body = {}) {
    /** Set request parameters */
    var options = {
        contentType: 'application/json',
        headers: {'X-API-KEY': xApiKey},
        muteHttpExceptions: true,
    }
    if (method === 'post') options.payload = body
    Logger.log(baseUrl)
    /** Requset API and return response */
    let response = UrlFetchApp.fetch(baseUrl, options)
    Logger.log(response.getResponseCode())
    Logger.log(response.getContentText())
    if ([200, 201].indexOf(response.getResponseCode()) == -1) return false
    Logger.log(response.getContentText())
    // return JSON.parse(response.getContentText())
}
