/*OpenWallet - Nanominer CUI intergration
* Decent comments, bad code. 
* Under the GNU GPLv3 License, viewable at - https://choosealicense.com/licenses/gpl-3.0/
* Full list of npm modules can be found in the ./node_modules folder, and soon the README.md
*/


//PREREQUESITES
const fs = require("fs");
const colors = require('colors');
const fetch = require('node-fetch');
const readline = require('readline');
const process = require('process');
let filePath = "./usersettings.config";
let log = "./log.txt";
const prompt = require('prompt-sync')();
const mainCoin = ["eth", "etc", "zec", "xmr", "rvn", "cfx", "erg", "ETH", "ETC", "ZEC", "XMR", "RVN", "CFX", "ERG"]

//Strings I should move to a different file
const startAnimation = ["","----                                                                               ----","--------------                                                            --------------","------------------------                                        ------------------------","----------------------------------                    ----------------------------------","----------------------------------------------------------------------------------------"];
const logo = '\
 #####                              ##   ##            ###      ###                ##   \n\
##   ##                             ##   ##             ##       ##                ##   \n\
##   ##  ######    ####    #####    ##   ##   ####      ##       ##      ####     ##### \n\
##   ##   ##  ##  ##  ##   ##  ##   ## # ##      ##     ##       ##     ##  ##     ##   \n\
##   ##   ##  ##  ######   ##  ##   #######   #####     ##       ##     ######     ##   \n\
##   ##   #####   ##       ##  ##   ### ###  ##  ##     ##       ##     ##         ## ##\n\
 #####    ##       #####   ##  ##   ##   ##   #####    ####     ####     #####      ### \n\
         ####                                                                           \n\
'


//START
async function start(){
    console.clear();
    //Shameless marketing.
    console.log(`\n\n${logo}`);
    //Tries to check if a file created but empty
    let flag = false;
    fs.readFile(filePath, function (err, data){
        try{
            console.log(data.indexOf("[START]"))
            if (data.indexOf("[START]") == 0){
                flag = true;
            }
        //Non-fatal error catch
        }catch(err){
            //console.log(err);
            errorCall(err); 
        }
    });

    //Cute little animation, nothing fancy, but its a CUI, a little painful code hasnt hurt anyone... sleep is very professional.
    await anim();

    //Flag is from the file empty checks
    if(fs.existsSync(filePath) && flag == true){
        login();
    }
    //No or empty file
    else if(flag == false){
        createFile();
    }
}   

//File management
async function createFile(){

    //Initial line write for search purposes
    fs.writeFileSync(filePath, "[START]\n");
    
    //Port set up, just so people can configure around other apps
    let port = prompt("Port : ");
    port > 9999? port == 9999 : port == port;
    fs.appendFileSync(filePath, `PORT = ${port}\n`);
    
        //Coin shorthand... im new to this.
        let id;
        let correct = 0;
        id = prompt("Coin : ");
        //If its not correct, it will reloop, removing the line to avoid clutter 
        while(correct != 2){
            if(mainCoin.indexOf(id)>-1){
                correct = 2;
            }else{
                correct = 1;
                console.log(`${id} does not exist.`.bgYellow.white);
                sleep(500);
                if(correct != 0){process.stdout.clearLine(), process.stdout.cursorTo(0)};
                id = prompt("Coin : ");
            }
        }
        id = coinParser(id);
        fs.appendFileSync(filePath,`ID = ${id}\n`);

    //Wallet set up, multi-wallets will be possible in the future using '[BREAK]' tags as spliting points.  
    //Checks will occur using nanopools account search in the future, it will only be flagged appropriately but not loop the set-up
    let wallet = prompt("Wallet : ");
    let check = await walletCheck(id,wallet);
    
    while(check == 'fail'){
        
        console.log(`${wallet} does not exist.`.bgYellow.white);
        sleep(500);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        wallet = prompt("Wallet : ");
        check = await walletCheck(id,wallet);

    }
    
      
    fs.appendFileSync(filePath,`WALLET = ${wallet}\n`);

    //Rig name set up, Misleading really as they will be used to identify profiles as well.
    let rig = prompt("Rig name : ");
    fs.appendFileSync(filePath, `RIG = ${rig}\n`);

    let algorithm;
    let lwID = id.toLowerCase()
    switch(lwID){
        case "eth":
            algorithm = "Ethash"
            break;
        case "etc":
            algorithm = "Etchash"
            break;
        case "ergo":
            algorithm = "autolykos"
            break;
        case "zec":
            algorithm = "Equihash"
            break;
        case "cfx":
            algorithm = "Octopus"
            break;
        case "rvn":
            algorithm = "KAWPOW"
            break;
        case "xmr":
            algorithm = "RandomX"
            break; 
        default:
            algorithm = "Unknown"
            
    }
    fs.appendFileSync(filePath, `ALGORITHM = ${algorithm}\n[END]`);
    

    console.log(`Algorithm : ${algorithm}`)
    sleep(600);
    
    
}

//Not yet worked on, will be a simple pop up ui, allowing access to wallet balances, profile loader and editor, quick start for new miners, help menus and guides. 
async function login(){
    let parsedJson = await configParser(filePath);
    screenReset(`${startAnimation[startAnimation.length-1]}\n\n${logo}\n${startAnimation[startAnimation.length-1]}`);
    console.log(parsedJson);
    //for(let i = 0; i <= returnVal[0].length() + 1; i++)
}

//!UTIL
//very good and non-deprecated function
function sleep(ms){
    return new Promise(resolve => setTimeout(resolve,ms));
}
//error catcher
function errorCall(ptErr){
    let now = new Date();
    let date = `[${now.getFullYear()}|${now.getMonth}|${now.getDay}] @ ${now.getHours()}:${now.getMinutes}:${now.getSeconds}`;
    fs.appendFileSync(log, `${date} - ${ptErr}`);
    console.log("Non-fatal error occurred, Check log file to see the console message.".bgYellow.white);
}
async function walletCheck(curr, address){
    try{
        let wallet = `https://api.nanopool.org/v1/${(curr)}/balance/${address}`

        let walletResponse = await fetch(wallet);
        let json = await walletResponse.json();
    
        if(json.status != false){
            return `${json.data}${curr}`;
        }else{
            return 'fail';
        }   
    }catch(err){
        return 'fail';
    }
 
}
//Current Hash checks the current reported hashrate
async function currentHash(curr, address){
    let flag = 0
    while(flag != 2){
        try{
            //Parses url, and checks the wallets status to decide if avaliable to read.
            let hash = `https://api.nanopool.org/v1/${curr}/hashrate/${address}`;
            let hashResponse = await fetch(hash);
            let json = await hashResponse.json();

            if(json.status != false){
                return(`${curr} : ${json.data}Mh/s`)
            }else{
                return(`| Current hashrate not avaliable |`.bgYellow.white);
            }
        }catch(err){
            return 'fail'; 
        }
    }
}

// Average hash checks the average reported hashrate over 1,6, and 24hrs
async function averageHashParser(curr, address){
    let flag = 0
    while(flag != 2){
        try{
            //Same as currentHash()
            let hash = `https://api.nanopool.org/v1/${curr}/avghashrate/${address}`;
            let hashResponse = await fetch(hash);
            let json = await hashResponse.json();

            if(json.status != false){
                return(`| 1hr ${json.data.h1} | 6hr ${json.data.h6} | 24hr ${json.data.h24} |`)
            }else{
                return(` | Average hashrate not avaliable |`.bgYellow.white);
            }
        }catch(err){
            return 'fail'; 
        }
    }
}

async function configParser(file){
    fs.readFile(file, 'utf-8', (err, data) =>{
        if(err){
            errorCall(err);
        }
        
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        
        
        let portTemp = [], walletTemp = [], idTemp = [], rigTemp = [], algTemp = [];
        rl.on('line', (line) =>{
            let value = line.split(" = ")[1];
            let tag = line.split(" = ")[0];
            
            switch(tag){
                case "PORT" :
                    portTemp.push(value) 
                    break;
                case "ID" :
                    idTemp.push(value)
                    break;
                case "RIG" :
                    rigTemp.push(value)
                    break;
                case "ALGORITHM" :
                    algTemp.push(value)
                    break;
                case "WALLET" :
                    walletTemp.push(value)
                    break;
                default:
                    break;
            }
            if (tag == "[END]"){
                return JSON.stringify([portTemp, idTemp, walletTemp, rigTemp, algTemp]); 
            }           
        })
            
        
    })
    
}

function coinParser(coin){
    if (coin == "ERG" || coin == "erg"){
        return coin = "ergo";
    }
    return coin.toLowerCase();
}

//Animation
async function anim(){
    let i = 1;
    console.clear();
    while(i<startAnimation.length){
        //Every .3 seconds the animation cycles through a phase at a low frame rate, pausing at the end and presenting the future full UI.
        await sleep(250).then(() =>{
            screenReset(`${startAnimation[i]}\n\n${logo}\n${startAnimation[i]}`);
            i++;
        })
    }
    sleep(500);
    console.clear()
    console.log(`${startAnimation[startAnimation.length-1]}\n\n${logo}\n${startAnimation[startAnimation.length-1]}`);
}

function screenReset(data){
    console.clear();
    sleep(30);
    console.log(data)
}

//start on launch. 
start();

