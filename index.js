/*const Gpio = require('pigpio').Gpio;

const led = new Gpio(17, {mode: Gpio.OUTPUT});

let dutyCycle = 0;

setInterval(() => {
  led.pwmWrite(dutyCycle);

  dutyCycle += 5;
  if (dutyCycle > 255) {
    dutyCycle = 0;
  }
}, 20);*/

//** this library lets us interface to the GPIO pins on the PI */
const Gpio = require('pigpio').Gpio;

//** this library lets us communicate to the pubnub service */
const PubNub = require('pubnub');

//** Set up the two servos */
const motor = new Gpio(10, {mode: Gpio.OUTPUT});
const motor2 = new Gpio(9, {mode: Gpio.OUTPUT});

//** 4 limit switches */
const limit = [
  new Gpio(6, {mode: Gpio.INPUT}),
  new Gpio(13, {mode: Gpio.INPUT}),
  new Gpio(19, {mode: Gpio.INPUT}),
  new Gpio(26, {mode: Gpio.INPUT})
];

//** set the internal pull ups so the switch inputs will have a default */
limit[0].pullUpDown(Gpio.PUD_UP);
limit[1].pullUpDown(Gpio.PUD_UP);
limit[2].pullUpDown(Gpio.PUD_UP);
limit[3].pullUpDown(Gpio.PUD_UP);

//** store the current status of each locker. Defaults to all unlocked and doors open */
let status = [
  {
    locked: false,
    opened: true
  },
  {
    locked: false,
    opened: true
  },
  {
    locked: false,
    opened: true
  },
  {
    locked: false,
    opened: true
  },
];

//** configure pubnub. Put your own keys here */
pubnub = new PubNub({
  publishKey : "pub-c-82e41f24-f0ef-4472-819d-501acafb78a0",
  subscribeKey : "sub-c-62be485c-907a-11ec-8102-a68c05a281ab",
  uuid: "myUniqueUUID"
})

//** tell pubnub what channel we want to watch */
pubnub.subscribe({
  channels: ["lock_control"]
});

//** Now start listening for messages */
pubnub.addListener({
  message: function (m) {
    console.log(m);

    setLocker(m.message.locker, m.message.locked);
  }
});

function setLocker(locker, locking) {
  switch (locker) {
    case 1:
        motor.servoWrite((locking) ? 2500: 1000);
      break;
    case 2:
      motor.servoWrite((locking) ? 1000: 500);
      break;
    case 3:
      motor2.servoWrite((locking) ? 2500: 1000);
      break;
    case 4:
      motor2.servoWrite((locking) ? 500: 500);
      break;
  }


}

//** start with the assumption that some or all doors are open */
motor.servoWrite(2500);
motor2.servoWrite(2500);


setInterval(() => {
  let sendupdate = false;

  for(l=0;l<4;l++) {
    if (!limit[l].digitalRead()) { //** currently closed? */
      if (status[l].opened) { //** but it was open before.. */
        setLocker(l, true); //** then lock it */
        status[l].opened = false; //** and flag it closed */
        sendupdate = true;
      }
    } else { //** currently open */
      if (!status[l].opened) { //** but it was closed before.. */
        status[l].opened = true; //** then flag it opened */
        sendupdate = true;
      }
    }
  }

  if (sendupdate) {
    sendupdate = false;

    pubnub.publish(
      {
        message: {
          status
        },
        channel: "lock_status"
      }
    )
  }
}, 100);
