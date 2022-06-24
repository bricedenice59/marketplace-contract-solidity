const web3Utils = require('../web3Utils');
const { v4: uuidv4 } = require('uuid');
const ContractBase = require('./contract-base.js');
const testUtils = require('./common');

try {
    (async () => {
        try {
            const instance = new ContractBase(process.env.CONTRACT_DEPLOYMENT_ADRESS);

            for (let index = 0; index < 100; index++) {
                const id = web3Utils.getKeccak256HexValueFromInput(uuidv4());
                var price = testUtils.getRandomNumberBetween(50, 240);
                var title = testUtils.generateRandomString(testUtils.getRandomNumberBetween(20, 70));
                var course = { id: id, title: title, price: price, courseOwner: '0x8105bc7cf3656bee6a3160292d40861ab3d6dc32709f00d0a84a171940f022bd' };
                var result = await instance.addNewCourse(course);
                console.log(result.transactionHash);

                //purchase course
                var resultPurchase = await instance.purchaseCourse(course);
                console.log(resultPurchase.transactionHash);
            }

            var result = await instance.getAllCoursesBoughtFromUser('0xC188d5A9E37963EA15968425d6cdC10541ABAeDE');
            console.log(result);
        }
        catch (e) {
            console.log(e.message);
        }
    })();
}
catch (e) {
    console.log(e);
}