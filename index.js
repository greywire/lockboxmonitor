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
const limit1 = new Gpio(6, {mode: Gpio.INPUT});
const limit2 = new Gpio(13, {mode: Gpio.INPUT});
const limit3 = new Gpio(19, {mode: Gpio.INPUT});
const limit4 = new Gpio(26, {mode: Gpio.INPUT});

//** set the internal pull ups so the switch inputs will have a default */
limit1.pullUpDown(Gpio.PUD_UP);
limit2.pullUpDown(Gpio.PUD_UP);
limit3.pullUpDown(Gpio.PUD_UP);
limit4.pullUpDown(Gpio.PUD_UP);

//** store the current status of each locker */
let status = [
  {
    locked: true,
    opened: false
  },
  {
    locked: true,
    opened: false
  },
  {
    locked: true,
    opened: false
  },
  {
    locked: true,
    opened: false
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

function setLocker(locker, locked) {
  switch (locker) {
    case 1:
      motor.servoWrite((locked) ? 2500: 500);
      break;
    case 2:
      motor.servoWrite((locked) ? 2500: 500);
      break;
    case 3:
      motor2.servoWrite((locked) ? 2500: 500);
      break;
    case 4:
      motor2.servoWrite((locked) ? 2500: 500);
      break;
  }


}

//** start locked */
motor.servoWrite(1500);
motor2.servoWrite(1500);


setInterval(() => {
  let sendupdate = false;

  if (!limit1.digitalRead()) {
    if (status[3])
    sendupdate = true;
    console.log("pushed");
  }

  if (!limit2.digitalRead()) {
    if (status[3])
    sendupdate = true;
    console.log("pushed");
  }
  if (!limit3.digitalRead()) {
    if (status[3])
    sendupdate = true;
    console.log("pushed");
  }
  if (!limit4.digitalRead()) {
    if (status[3])
    sendupdate = true;
    console.log("pushed");
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
