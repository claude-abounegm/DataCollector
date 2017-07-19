# DataCollector

**To install**

    npm install

**To run**

    npm run start
    
You can then post to `/api/sensors/light` or `/api/sensors/temperature`
Check PostmanTests folder for a working POST request test.

# What is this
Our Senior Project consisted of three Raspberry Pis. This one, which collects light and temperature data using sensors. Based on pre-defined conditions, this Raspberry Pi commands the Smart Mirror to do actions such as turn on/off the lights, turn on/off HVAC, and open/close blinds.

The other Raspberry Pi ran our modified Smart Mirror code. The third Raspberry Pi communicated with the external devices which needed a bridge to control them such as the blinds and the HVAC. For more information about the project, [click here](https://github.com/claude-abounegm/iot-controller).
