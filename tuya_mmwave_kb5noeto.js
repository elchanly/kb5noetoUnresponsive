
const fz = require('zigbee-herdsman-converters/converters/fromZigbee');
const exposes = require('zigbee-herdsman-converters/lib/exposes');
const tuya = require('zigbee-herdsman-converters/lib/tuya');
const e = exposes.presets;
const ea = exposes.access;

const fromZigbee = {
    tuya_presence_sensor: {
        cluster: 'manuSpecificTuya',
        type: ['commandDataResponse'],
        convert: (model, msg, publish, options, meta) => {
            const dp = msg.data.dp;
            const value = tuya.getDataValue(msg.data.datatype, msg.data.data);

            const result = {};
            switch (dp) {
                case 1:
                    result.occupancy = value === 1;
                    break;
                case 104:
                    result.illuminance_lux = value > 0 ? Math.round(10000 * Math.log10(value) + 1) : 0;
                    break;
                case 109:
                    result.temperature = value / 100;
                    break;
                case 110:
                    result.sensitivity = value;
                    break;
                case 111:
                    result.range = value;
                    break;
                case 107:
                    result.detection_delay = value;
                    break;
                case 108:
                    result.fading_time = value;
                    break;
                default:
                    meta.logger.debug(`Unhandled DP #${dp}: ${JSON.stringify(msg.data)}`);
            }

            return result;
        },
    },
};

module.exports = {
    zigbeeModel: ['TS0601'],
    model: 'ZG-204ZM',
    vendor: 'Tuya',
    description: 'Tuya mmWave presence sensor (_TZE200_kb5noeto)',
    fromZigbee: [fromZigbee.tuya_presence_sensor],
    toZigbee: [],
    exposes: [
        e.occupancy(),
        e.illuminance_lux(),
        e.numeric('temperature', ea.STATE).withUnit('°C'),
        e.numeric('sensitivity', ea.STATE).withDescription('Sensor sensitivity (1-9)'),
        e.numeric('range', ea.STATE).withDescription('Detection range in meters'),
        e.numeric('detection_delay', ea.STATE).withUnit('ms'),
        e.numeric('fading_time', ea.STATE).withUnit('ms'),
    ],
    configure: async (device, coordinatorEndpoint, logger) => {
        await device.getEndpoint(1).read('manuSpecificTuya', [0xEF00]);
    },
    whiteLabel: [{vendor: 'Tuya', model: '_TZE200_kb5noeto'}],
};
