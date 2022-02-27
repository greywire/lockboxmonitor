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
  new Gpio(26, {mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP,
    alert: true}),
  new Gpio(13, {mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP,
    alert: true}),
  new Gpio(19, {mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP,
    alert: true}),
  new Gpio(6, {mode: Gpio.INPUT, pullUpDown: Gpio.PUD_UP,
    alert: true})
];

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
      if (!status[0].opened) 
      motor.servoWrite((locking) ? 1000:2500);
      break;
    case 2:
      if (!status[1].opened) 
      motor.servoWrite((locking) ? 1000: 500);
      break;
    case 3:
      if (!status[2].opened) 
      motor2.servoWrite((locking) ? 1000:2500);
      break;
    case 4:
      if (!status[3].opened) 
      motor2.servoWrite((locking) ? 1000: 500);
      break;
  }

  status[locker-1].locked = locking;

  sendstatus();

  servosOff();
}

function servosOff() {
  setTimeout(() => {
    console.log("turn off servos");
    motor.servoWrite(0);
    motor2.servoWrite(0);
  }, 10000);
}

function sendstatus() {
  pubnub.publish(
    {
      message: {
        status
      },
      channel: "lock_status"
    }
  )
}

//** start with the assumption that some or all doors are open */
motor.servoWrite(2500);
motor2.servoWrite(2500);
servosOff();
console.log("default servo position");

function handleLimit(state, l) {
  if (!state) { //** currently closed? */
    if (status[l].opened) { //** but it was open before.. */
      setLocker(l+1, true); //** then lock it */
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

limit.forEach((l,index) => {
  l.glitchFilter(10000);//** set a debounce time for each switch */
  l.on(
    'alert', (level,tick) => {
      handleLimit(level, index);
    }
  )
});

let sendupdate = false;

setInterval(() => {

  if (sendupdate) {
    sendupdate = false;

    sendstatus();
  }
}, 1000);
