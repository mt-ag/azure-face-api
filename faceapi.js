'use strict';

/*
This package should not be used in a production
environment. It's just used to make this demo
easier to read and to understand.
*/
const request = require('sync-request');

// Replace <Subscription Key> with your valid subscription key.
const subscriptionKey = 'ValidSubscriptionKey';

const headerInformation = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key' : subscriptionKey
};

// You must use the same location in your REST call as you used to get your
// subscription keys. For example, if you got your subscription keys from
// westus, replace "westcentralus" in the URL below with "westus".
const uriBase = 'https://westcentralus.api.cognitive.microsoft.com/face/v1.0';

const groupId = 'famous-people';
const recognitionModel  = "recognition_02";

detectFace("https://static01.nyt.com/images/2014/02/20/business/20CORNER/20CORNER-superJumbo-v2.jpg");

startTraining();

// Check training status and validate the result.
const interval = setInterval(() => {
    
    /**
     * Get training status
    */ 
    console.log("\nGet training status ...");
    var res = request('GET', uriBase + `/persongroups/${groupId}/training`, {
        headers: headerInformation
    });
    printResult(res);

    var jsonResult = JSON.parse(res.getBody('utf8'));
    
    if(jsonResult.status === 'succeeded') {
        clearInterval(interval);
        validate();
    }
}, 5000);

function detectFace(imageUrl) {

    console.log("\nDetecting face ...");

    const param1 = "returnFaceId=true"
    const param2 = "returnFaceAttributes=age,gender,glasses,hair,emotion"
    const param3 = "recognitionModel=" + recognitionModel;
    
    var res = request('POST', uriBase + `/detect?${param1}&${param2}&${param3}`
    , {
        headers: headerInformation,
        json: {
            "url" : imageUrl
        }       

    });

    printResult(res);

    const firstFaceId = (JSON.parse(res.getBody('utf8')))[0].faceId;
    return firstFaceId;
}

function validate() {

    const faceId = detectFace("https://static01.nyt.com/images/2014/02/20/business/20CORNER/20CORNER-superJumbo-v2.jpg");

    var res = request('POST', uriBase + '/identify', {
        headers: headerInformation,
        json: {
            "faceIds": [ faceId ], 
            "personGroupId": groupId
        }       
    });
    printResult(res);

    const faceId2 = detectFace("https://timedotcom.files.wordpress.com/2018/09/bill-gates-africa.jpg");
    
    var res = request('POST', uriBase + '/identify', {
        headers: headerInformation,
        json: {
            "faceIds": [ faceId2 ], 
            "personGroupId": groupId
        }       
    });
    printResult(res);

}

function startTraining() {
    /**
     * Deleting an existing person group
     */
    console.log("\nDeleting an existing person group ...");
    var res = request('DELETE', uriBase + `/persongroups/${groupId}`, {
        headers: headerInformation,
    });

    /**
     * Creating a new person group
     */
    console.log("\nCreating a new person group ...");
    var res = request('PUT', uriBase + `/persongroups/${groupId}`, {
        headers: headerInformation,
        json: {
            "name": "Famous People in Technology",
            "userData": "user-provided data attached to the person group.",
            "recognitionModel" : recognitionModel
        }
    });
    printResult(res, false);

    /**
     * List all existing person groups
     */
    console.log("\nListing all existing person groups ...");
    var res = request('GET', uriBase + `/persongroups`, {
        headers: headerInformation,
    });
    printResult(res);

    /**
     * Create a new person within the previously created person group.
     */
    console.log("\nCreating a new person ...");
    var res = request('POST', uriBase + `/persongroups/${groupId}/persons`, {
        headers: headerInformation,
        json: {
            "name": "Satya Nadella",
        }
    });
    printResult(res);
    const personId = (JSON.parse(res.getBody('utf8'))).personId;

    /**
     * List all exisintg persons existing in the previously created person group.
     */
    console.log("\nListing all persons ...");
    var res = request('GET', uriBase + `/persongroups/${groupId}/persons`, {
        headers: headerInformation
    });
    printResult(res);

    /**
     * Upload faces
     */
    var urlFaces = ["https://3er1viui9wo30pkxh1v2nh4w-wpengine.netdna-ssl.com/wp-content/uploads/prod/2019/01/satya-nadella-ceo-event-details-timeline.jpg", 
                    "https://content.fortune.com/wp-content/uploads/2018/08/satya-nadella.jpg", 
                    "https://www.investors.com/wp-content/uploads/2019/01/LSMAIN-satya-011119-AP.jpg",
                    "https://static2.businessinsider.de/image/5ccb1b09e9f08a2656685c55-2400/satya%20nadella%20davos.jpg",
                    "https://i.ndtvimg.com/i/2017-09/satya-nadella-microsoft-ceo-twitter_650x400_81506407825.jpg",
                    "https://images.techhive.com/images/idge/imported/imageapi/2014/05/slide_020414-nadella-1-100290192-gallery.idge.jpg",
                    "https://akm-img-a-in.tosshub.com/indiatoday/images/story/201709/cs-satya-nadela-essay-oct2-1-647_092617121020.jpg",
                    "https://chiefexecutive.net/wp-content/uploads/2018/03/GettyImages-675949754-compressor.jpg",
                    "https://images.cnbctv18.com/wp-content/uploads/2019/01/AP19022396658390-768x498.jpg",
                    "https://www.crn.com/resources/024a-0ae1de0c3d72-ebdffc5a763a-1000/nadella.jpg",
                    "https://miro.medium.com/max/1240/1*DjJEf5cmHG078RxKjG7vKQ.png"];

    console.log("\nUploading images ...");
    urlFaces.forEach(function(url) {
        var res = request('POST', uriBase + `/persongroups/${groupId}/persons/${personId}/persistedFaces?recognitionModel=${recognitionModel}`, {
            headers: headerInformation,
            json: {
                "url": url
            }
        });
        printResult(res);
    });

    /**
     * Train the model
     */
    console.log("\nTraining the model ...");
    var res = request('POST', uriBase + `/persongroups/${groupId}/train`, {
        headers: headerInformation
    });
    printResult(res);
}

function printResult(res, printResult = true) {
    console.log("\nHttp status code: " + res.statusCode);
    if(res.statusCode === 200 && printResult) {
        console.log(JSON.stringify(JSON.parse(res.getBody('utf8')), null, 2));
    }
}