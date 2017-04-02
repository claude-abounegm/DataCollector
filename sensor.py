#!/usr/bin/python

import os
import glob
import time
import sys

import json
import requests

import math

import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)
os.system('modprobe w1-gpio')
os.system('modprobe w1-therm')

BASE_DIR = '/sys/bus/w1/devices/'

DEBUG = 1
READ_DELAY = 0.5
AVERAGE_COUNT = 3

UPDATE_URL = "http://127.0.0.1:3000/api/sensors/"

TEMP_SENSOR_ID = "TEMP0"
TEMP_SENSOR_KEY = "28-0516b2d083ff"

LIGHT_SENSOR_ID = "LIGHT0"
LIGHT_SENSOR_KEY = "LIGHT0"
LIGHT_MIN_VALUE = 0.0
LIGHT_MAX_VALUE = 800000.0
LIGHT_PIN = 18

# START TEMPERATURE #
def get_temperature_file():
	file = None;
	try:
		file = glob.glob(BASE_DIR + '28*')[0] + '/w1_slave';
	except:
		pass;
	return file;

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
	total_f = 0;
	for i in range(0, AVERAGE_COUNT):
		temp_c, temp_f = read_temperature(file)
		total_f += temp_f
	return total_f/AVERAGE_COUNT
# END TEMPERATURE #

# START LIGHT #
def RCtime (RCpin):
        reading = 0
        GPIO.setup(RCpin, GPIO.OUT)
        GPIO.output(RCpin, GPIO.LOW)
        time.sleep(0.1)
 
        GPIO.setup(RCpin, GPIO.IN)
        # This takes about 1 millisecond per loop cycle
        while (GPIO.input(RCpin) == GPIO.LOW and reading < LIGHT_MAX_VALUE):
                reading += 1
        return math.exp((-reading*10)/LIGHT_MAX_VALUE) * 100
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
		post_data('light', LIGHT_SENSOR_ID, LIGHT_SENSOR_KEY, RCtime(LIGHT_PIN))
	except KeyboardInterrupt:
		break
	except Exception as e:
		print('Error getting light reading: ' + str(e))

	time.sleep(READ_DELAY)