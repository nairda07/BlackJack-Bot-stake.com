async function noInsurance(page, session, betamount) {
    const response = await page.evaluate(async (sessionCookies) => {
        const requestData = {
            "query": "mutation BlackjackNext($action: BlackjackNextActionInput!, $identifier: String!) {\n  blackjackNext(action: $action, identifier: $identifier) {\n    ...CasinoBet\n    state {\n      ...CasinoGameBlackjack\n    }\n  }\n}\n\nfragment CasinoBet on CasinoBet {\n  id\n  active\n  payoutMultiplier\n  amountMultiplier\n  amount\n  payout\n  updatedAt\n  currency\n  game\n  user {\n    id\n    name\n  }\n}\n\nfragment CasinoGameBlackjack on CasinoGameBlackjack {\n  player {\n    value\n    actions\n    cards {\n      rank\n      suit\n    }\n  }\n  dealer {\n    value\n    actions\n    cards {\n      rank\n      suit\n    }\n  }\n}\n",
            "variables": {
                "identifier": 'ZN2IlB3vM253uTzrzea_y',
                "action": "noInsurance",
            }
        };

        const accessToken = sessionCookies.find(cookie => cookie.name === 'session')?.value;

        const response = await fetch('https://stake.com/_api/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': accessToken
            },
            body: JSON.stringify(requestData)
        });

        return await response.json();
    }, session.cookies);

    return response;
}
module.exports = noInsurance;