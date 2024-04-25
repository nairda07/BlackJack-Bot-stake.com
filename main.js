const puppeteer = require('puppeteer');
const {manageSession} = require('./auth');

const startbet = require('./actions/startbet');
const hit = require('./actions/hit');
const stand = require('./actions/stand');
const noInsurance = require('./actions/noInsurance');




let betamount = 0.00000001;
const originalBetamount = betamount;




let winCount = 0;
let loseCount = 0;


const strategyTable = {
    player: {
        '2': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        '3': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        '4': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        '5': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        '6': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        '7': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        '8': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        '9': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        '10': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        'K': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        'Q': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        'J': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        '11': ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
        '12': ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
        '13': ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
        '14': ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
        '15': ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
        '16': ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
        '17': ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
        '18': ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
        '19': ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
        '20': ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    },
    dealer: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
};

function getBestAction(playerHand, dealerCard) {
    const playerCards = playerHand.cards;

    // for (let i = 0; i < playerCards.length; i++) {
    //     if (playerCards[i].rank === 'A') {
    //         return '###';
    //     }
    // }

    const playerValue = playerHand.value;
    const playerValueString = playerValue.toString();
    const dealerValue = dealerCard.value;
    const dealerValueString = dealerValue.toString();



    if (strategyTable.player[playerValueString] && strategyTable.dealer.includes(dealerValueString)) {
        const dealerIndex = strategyTable.dealer.indexOf(dealerValueString);

        console.log('hirsch', `Player: ${playerValue}, Dealer: ${dealerValue}, Action: ${strategyTable.player[playerValueString][dealerIndex]}`);

        return strategyTable.player[playerValueString][dealerIndex];
    }

    return '###S';

    // hier

}


(async () => {
        const chalk = (await import('chalk')).default;

        const browser = await puppeteer.launch({headless: false});
        const pages = await browser.pages();
        const page = pages[0];

        const session = await manageSession(page);

        await page.waitForFunction(() => window.location.href.includes('/casino/games/blackjack'));
        console.log('Blackjack wurde geladen.');

        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('Go');

        while (true) {
            const response = await startbet(page, session, betamount);

            if (response && response.data && response.data.blackjackBet && response.data.blackjackBet.state) {
                let playerData = response.data.blackjackBet.state.player[0];
                let dealerData = response.data.blackjackBet.state.dealer[0];

                if (dealerData.cards[0].rank === 'A') {
                    const insuranceResponse = await noInsurance(page, session, betamount);
                    console.log('Versicherung');

                    if (insuranceResponse.data.blackjackNext.active === false) {
                        console.log('einfach dealer 21');
                        continue;
                    }
                }


                let matchEnded = false;
                while (!matchEnded) {
                    // console.log('Player:', playerData);
                    // console.log('Dealer:', dealerData);

                    const bestAction = getBestAction(playerData, dealerData);

                    let nextResponse;
                    if (bestAction === 'H') {
                        nextResponse = await hit(page, session, betamount);
                    } else if (bestAction === 'S') {
                        nextResponse = await stand(page, session, betamount);
                    }

                    if (nextResponse && nextResponse.data && nextResponse.data.blackjackNext) {
                        if (nextResponse.data.blackjackNext.active === false) {
                            matchEnded = true;

                            const payoutMultiplier = nextResponse.data.blackjackNext.payoutMultiplier;

                            if (payoutMultiplier === 0) {
                                console.log(chalk.red('Lose'));
                                loseCount++;
                                betamount *= 2; // Verdoppeln des Betrags bei Verlust
                            } else if (payoutMultiplier === 2) {
                                console.log(chalk.green('Win'));
                                winCount++;
                                betamount = originalBetamount; // Zurücksetzen des Betrags bei Gewinn
                            } else if (payoutMultiplier === 1) {
                                console.log(chalk.yellow('Unentschieden'));
                                // Bei Unentschieden bleibt der Betrag unverändert
                            }

                            console.log('-------------------------------');
                            console.log(chalk.bold(`Wins: ${winCount} | Loses: ${loseCount}`));
                            console.log(chalk.bold(`Betamount: ${betamount}`)); // Ausgabe des aktuellen Betrags
                            console.log('-------------------------------');
                        } else {
                            playerData = nextResponse.data.blackjackNext.state.player[0];
                            dealerData = nextResponse.data.blackjackNext.state.dealer[0];
                        }
                    } else {
                        console.log('hier was kapput.');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await page.reload();
                        await stand(page, session, betamount);
                        break;

                    }
                }

            } else {
                console.log('Ungültige Antwort von startbet. Überprüfe die GraphQL-Anfrage und die Antwort.');
            }

            browser.on('disconnected', () => {
                console.log('Browser wurde geschlossen.');
            });
        }
    }
)
();