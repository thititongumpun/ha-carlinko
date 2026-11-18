// Code shared by both languages. Entity IDs follow README's `CAR` placeholder convention.
export const repo = 'https://github.com/thititongumpun/ha-carlinko';

export const hacsUrl = repo;
export const resourceUrl = '/carlinko/carlinko-card.js?v=0.0.22';

export const card = `type: custom:carlinko-card
battery_kwh: 61      # usable pack size, for "energy left"
mask_plate: true     # show the plate as B •••• PGB`;

export const serviceReminder = `alias: Car service reminder
triggers:
  - trigger: numeric_state
    entity_id: sensor.CAR_distance_until_service
    below: 1000
  - trigger: numeric_state
    entity_id: sensor.CAR_days_until_service
    below: 30
  - trigger: state
    entity_id: sensor.CAR_next_service
    to: overdue
actions:
  - action: notify.mobile_app_YOUR_PHONE
    data:
      title: Car service due
      message: "{{ states('sensor.CAR_distance_until_service') }} km / {{ states('sensor.CAR_days_until_service') }} days left"`;

export const chargeDone = `alias: Car finished charging
triggers:
  - trigger: state
    entity_id: binary_sensor.CAR_charging
    from: "on"
    to: "off"
conditions:
  # still plugged in, so it stopped on its own rather than being unplugged
  - condition: state
    entity_id: binary_sensor.CAR_cable_connected
    state: "on"
actions:
  - action: notify.mobile_app_YOUR_PHONE
    data:
      title: Charging finished
      message: "{{ states('sensor.CAR_battery') }} % · {{ states('sensor.CAR_range') }} km range"`;

export const leftUnlocked = `alias: Car left unlocked
triggers:
  - trigger: state
    entity_id: lock.CAR_door_lock
    to: unlocked
    for: "00:10:00"
conditions:
  # car is switched off
  - condition: state
    entity_id: binary_sensor.CAR_high_voltage_system
    state: "off"
actions:
  - action: notify.mobile_app_YOUR_PHONE
    data:
      title: Car is unlocked
      message: Unlocked for 10 minutes with the car off.`;

export const debugLog = `logger:
  logs:
    custom_components.carlinko: debug`;
