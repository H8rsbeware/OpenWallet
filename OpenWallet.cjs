/*OpenWallet - Nanominer CUI intergration
* Decent comments, bad code. 
* Under the GNU GPLv3 License, viewable at - https://choosealicense.com/licenses/gpl-3.0/
* Full list of npm modules can be found in the ./node_modules folder, and soon the README.md
*/


//PREREQUESITES
const fs = require("fs");
const colors = require('colors');
let filePath = "./usersettings.config";
let log = "./log.txt";
const prompt = require('prompt-sync')();

//Strings I should move to a different file
const startAnimation = ["","----                                                                               ----","--------------                                                            --------------","------------------------                                        ------------------------","----------------------------------                    ----------------------------------","----------------------------------------------------------------------------------------\n"];
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
    //Shameless marketing.
    console.log(logo)
    //Tries to check if a file created but empty
    let flag = false;
    fs.readFile(filePath, function (err, data){
        try{
            console.log(data.indexOf("[START]"))
            if (data.indexOf("[START]") >=1){
                flag = true;
            }
        //Non-fatal error catch
        }catch(err){
            //console.log(err);
            errorCall(err); 
        }
    });

    //Cute little animation, nothing fancy, but its a CUI, a little painful code hasnt hurt anyone... sleep is very professional.
    let i = 0;
    while(i<startAnimation.length){
        //Every .3 seconds the animation cycles through a phase at a low frame rate, pausing at the end and presenting the future full UI.
        await sleep(300).then(() =>{
            console.clear();
            console.log(`${startAnimation[i]}\n${logo}\n${startAnimation[i]}`);
            i++;
        })
    }
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
function createFile(){

    //Initial line write for search purposes
    fs.writeFileSync(filePath, "[START]");
    
    //Port set up, just so people can configure around other apps
    let port = prompt("Port : ");
    port > 9999? port == 9999 : port == port;
    fs.appendFileSync(filePath, `PORT = ${port}\n`);
    
    //Wallet set up, multi-wallets will be possible in the future using '[BREAK]' tags as spliting points.  
    //Checks will occur using nanopools account search in the future, it will only be flagged appropriately but not loop the set-up
    let wallet = prompt("Wallet : ");
    fs.appendFileSync(filePath,`WALLET = ${wallet}\n`);

    //Coin shorthand... im new to this.
    let id;
    let correct = false;
    //If its not correct, it will reloop, removing the line to avoid clutter 
    while(!correct){
        process.stdout("\r\x1b[K");
        id = prompt("Coin : ");
        if(id.length > 4){
            correct = false;
        }else{
            correct = true;
            break;
        }
    }
    fs.appendFileSync(filePath,`ID = ${id}\n`);

    //Rig name set up, Misleading really as they will be used to identify profiles as well.
    let rig = prompt("Rig name : ");
    fs.appendFileSync(filePath, `RIG = ${rig}\n`);
    
}

//Not yet worked on, will be a simple pop up ui, allowing access to wallet balances, profile loader and editor, quick start for new miners, help menus and guides. 
function login(){
    const http = require('http');
    const port = parseInt(`${2000}`, 10)||5555; //ADD CONFIG PARSING CODE
    //const name = 
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

//start on launch. 
start();
