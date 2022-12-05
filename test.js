const fs = require('fs');
const eWeLink = require('./main');

const rawdata = fs.readFileSync('credentials.json');
const credentials = JSON.parse(rawdata);
const rawdata2 = fs.readFileSync('credentials2.json');
const credentials2 = JSON.parse(rawdata2);

const args = Number(process.argv.slice(2)[0]);
console.log(args);
const functions = [
  async function main() {
    const client = new eWeLink(credentials);
    console.log(client);
    const credential2 = await client.getCredentials();
    const saveCredentials = JSON.stringify(
      {
        at: credential2.at,
        rt: credential2.rt,
        email: credentials.email,
        apiKey: credential2.user.apikey,
      },
      null,
      2
    );
    fs.writeFileSync('credentials2.json', saveCredentials);
    console.log(credential2);
    return 0;
  },
  async function main2() {
    console.log(credentials2);
    const client = new eWeLink(credentials2);
    console.log(client);
    const credential2 = await client.getCredentials();
    console.log(credential2);
    // const devices = await client.getDevices();
    // console.log(devices);
    return 0;
  },
  async function main3() {
    const client = new eWeLink(credentials2);
    await client.getCredentials();
    console.log(client.activeWebSocket);
    await client.openWebSocket((data) => {
      console.log(client.activeWebSocket);
    });
    setTimeout(async () => {
      await client.openWebSocket((data) => {
        console.log(client.activeWebSocket);
      });
    }, 2000);

    setTimeout(() => {
      console.log('Closing connection...');
      client.wsp.close();
    }, 5000);

    setTimeout(() => {
      console.log(client.activeWebSocket);
      console.log(client.wsp);
    }, 8000);
    // const devices = await client.getDevices();
    // console.log(devices);
    return 0;
  },
];

functions[args]();
