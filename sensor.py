#!/usr/bin/python

import os;
import glob;
import time;
import json;
import sys;
import requests;
import math;

# FOR LIGHT DATA #
import RPi.GPIO as GPIO, time, os      
 
DEBUG = 1
GPIO.setmode(GPIO.BCM)
# END OF FOR LIGHT DATA #

#ABBY
DIR = '/home/pi/thermostat';
PAUSE_INTERVAL = 5;
TEMP_UPDATE_URL = "http://127.0.0.1:3000/api/temp"; # Replace with your remote URL
LIGHT_UPDATE_URL = "http://127.0.0.1:3000/api/light"; # Replace with your remote URL
VERBOSE = True;

TEMP_SENSOR_ID = "TEST"; # Change this to your public sensor ID.
TEMP_SENSOR_KEY = "28-0516b2d083ff"; # Change this to your private sensor key.
LIGHT_SENSOR_ID = "TEST"; # Change this to your public sensor ID.
LIGHT_SENSOR_KEY = "TEST"; # Change this to your private sensor key.

MIN_VALUE = 0
MAX_VALUE = 800000.0 #100000.0
#END ABBY

os.system('modprobe w1-gpio');
os.system('modprobe w1-therm');

READ_DELAY = 0.5;
AVERAGE_COUNT = 3;

BASE_DIR = '/sys/bus/w1/devices/';

def get_device_file():
	global BASE_DIR;
	file = None;
	try:
		file = glob.glob(BASE_DIR + '28*')[0] + '/w1_slave';
	except:
		pass;
	return file;

def read_temp_raw(device_file):
	lines = None;
	with open(device_file, 'r') as file:
		lines = file.readlines();
	return lines;

def read_temp(device_file):
	lines = None;
	equals_pos = -1;
	while equals_pos < 0 or lines[0].strip()[-3:] != 'YES':
		time.sleep(0.2);
		lines = read_temp_raw(device_file);
		equals_pos = lines[1].find('t=');
	temp_string = lines[1][equals_pos+2:];
	temp_c = float(temp_string)/1000.0;
	temp_f = temp_c * 9.0 / 5.0 + 32.0;
	return (temp_c, temp_f);

def get_average_temp(device_file):
	global AVERAGE_COUNT;
	
	total_f = 0;
	for i in range(0,AVERAGE_COUNT):
		temp_c, temp_f = read_temp(device_file);
		total_f += temp_f;
	return total_f/AVERAGE_COUNT;

def post_current_temp(temp):
	payload = {
		'id':           TEMP_SENSOR_ID,
		'key':          TEMP_SENSOR_KEY,
		'temperature':  temp,
		'time':         int(time.time())
	};

	try:
		resp = requests.post(TEMP_UPDATE_URL, data=payload);
		data = json.loads(resp.text);
		if(data["success"] is True):
			return True;
	except:
		return False;

# FOR LIGHT DATA #
def RCtime (RCpin):
        reading = 0
        GPIO.setup(RCpin, GPIO.OUT)
        GPIO.output(RCpin, GPIO.LOW)
        time.sleep(0.1)
 
        GPIO.setup(RCpin, GPIO.IN)
        # This takes about 1 millisecond per loop cycle
        while (GPIO.input(RCpin) == GPIO.LOW and reading < MAX_VALUE):
                reading += 1
        return math.exp((-reading*10)/MAX_VALUE) * 100

def post_current_light(light):
	payload = {
		'id':           TEMP_SENSOR_ID,
		'key':          TEMP_SENSOR_KEY,
		'light':        light,
		'time':         int(time.time())
	};

	try:
		resp = requests.post(LIGHT_UPDATE_URL, data=payload);
		data = json.loads(resp.text);
		if(data["success"] is True):
			return True;
	except:
		return False;

# END OF FOR LIGHT DATA #

# First try to get the device file

print('Finding sensor device file...\n');

device_file = None;
while (device_file is None):
	print('Not found');
	device_file = get_device_file();
	time.sleep(0.5);

print('\nDevice found!\n');

# Now the actual sensor loop
while (True):
	avg_temp = -1;
	try:
		avg_temp = get_average_temp(device_file);
		if(avg_temp > 0):
			post_current_temp(avg_temp);
			print('({:d}) {:1.3f} F'.format(int(time.time()), avg_temp));
	except KeyboardInterrupt:
		break;
	except Exception as e:
		print('Error getting temp reading: '+str(e));

	light_value = RCtime(18);
	post_current_light(light_value); # FOR LIGHT DATA #
	# FOR LIGHT DATA #
	print light_value     # Read RC timing using pin #18
	# FOR LIGHT DATA #
	
	time.sleep(READ_DELAY);
