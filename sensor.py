#!/usr/bin/python

import sys
import os
import glob
import time

import json
import requests

import math

import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
os.system('modprobe w1-gpio')
os.system('modprobe w1-therm')

BASE_DIR = '/sys/bus/w1/devices/'

READ_DELAY = 0.5
if(len(sys.argv) >= 2):
    READ_DELAY = float(sys.argv[1])

AVERAGE_COUNT = 3

UPDATE_URL = "http://127.0.0.1:3000/api/sensors/"

TEMP_SENSOR_ID = "TEMP0"
TEMP_SENSOR_KEY = "28-0516b2d083ff"

LIGHT_SENSOR_ID = "LIGHT0"
LIGHT_SENSOR_KEY = "LIGHT0"
LIGHT_MAX_VALUE = 120.0

LIGHT_INPUT_PIN = 18
LIGHT_OUTPUT_PIN = 23

CAPACITOR_FARADS = 2.27/1000000.0
RC_DIVISOR = (-CAPACITOR_FARADS*math.log(1-1.2/3.31))

# START TEMPERATURE #
def get_temperature_file():
	file = None
	try:
		file = glob.glob(BASE_DIR + '28*')[0] + '/w1_slave'
	except:
		pass
	return file

def read_temperature(file):
	lines = None
	equals_pos = -1

	while equals_pos < 0 or lines[0].strip()[-3:] != 'YES':
		time.sleep(0.2)
		with open(file, 'r') as file:
			lines = file.readlines()
		equals_pos = lines[1].find('t=')

	temp_string = lines[1][equals_pos+2:]
	temp_c = float(temp_string)/1000.0
	temp_f = temp_c * 9.0/5.0 + 32.0
	return (temp_c, temp_f)

def get_average_temperature(file):	
	total_f = 0
	for i in range(0, AVERAGE_COUNT):
		temp_c, temp_f = read_temperature(file)
		total_f += temp_f
	return total_f/AVERAGE_COUNT
# END TEMPERATURE #

# START LIGHT #
def setup_rc(inputPin, outputPin):
        # initially discharge the capacitor
        GPIO.setup(inputPin, GPIO.OUT)
        GPIO.output(inputPin, GPIO.LOW)

        GPIO.setup(outputPin, GPIO.OUT)
        time.sleep(0.3)

def get_rc_resistance(inputPin, outputPin):
        total = 0
        for i in range(0, AVERAGE_COUNT):
            GPIO.output(outputPin, GPIO.HIGH)
            
            # read the capacitor voltage (HIGH ~1.2V)
            GPIO.setup(inputPin, GPIO.IN)
            timeBefore = time.time();
            while (GPIO.input(inputPin) == GPIO.LOW):
                pass
            
            total += (time.time() - timeBefore)/RC_DIVISOR            
            GPIO.output(outputPin, GPIO.LOW)
            GPIO.setup(inputPin, GPIO.OUT)
            GPIO.output(inputPin, GPIO.LOW)
            time.sleep(0.3)

        
        return total/AVERAGE_COUNT
# END LIGHT #

def post_data(sensorType, id, key, value):
	payload = {
		'id':           id,
		'key':          key,
		'value':		value,
		'time':         int(time.time())
	}
	print('{:s}: ({:d}) {:1.3f}'.format(sensorType, payload['time'], value))

	try:
		resp = requests.post(UPDATE_URL + sensorType, data = payload)
		data = json.loads(resp.text)
		return data["success"] is True
	except:
		return False

setup_rc(LIGHT_INPUT_PIN, LIGHT_OUTPUT_PIN)
print ('Collecting Data')
sys.stdout.flush()
device_file = get_temperature_file()
while (True):
	try:
		avg_temp = -1
		if(device_file is None):
			print('Sensor not found')
			device_file = get_temperature_file()
		else:
			avg_temp = get_average_temperature(device_file)
			if(avg_temp > 0):
				post_data('temperature', TEMP_SENSOR_ID, TEMP_SENSOR_KEY, avg_temp)
	except KeyboardInterrupt:
		break
	except Exception as e:
		print('Error getting temp reading: ' + str(e))

	try:
		post_data('light', LIGHT_SENSOR_ID, LIGHT_SENSOR_KEY, get_rc_resistance(LIGHT_INPUT_PIN, LIGHT_OUTPUT_PIN))
	except KeyboardInterrupt:
		break
	except Exception as e:
		print('Error getting light reading: ' + str(e))

	time.sleep(READ_DELAY)
