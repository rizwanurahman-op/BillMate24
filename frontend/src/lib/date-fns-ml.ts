import { enIN } from 'date-fns/locale';
import { Locale } from 'date-fns';

const months = [
    'ജനുവരി',
    'ഫെബ്രുവരി',
    'മാർച്ച്',
    'ഏപ്രിൽ',
    'മെയ്',
    'ജൂൺ',
    'ജൂലൈ',
    'ഓഗസ്റ്റ്',
    'സെപ്റ്റംബർ',
    'ഒക്ടോബർ',
    'നവംബർ',
    'ഡിസംബർ',
];

const days = [
    'ഞായർ',
    'തിങ്കൾ',
    'ചൊവ്വ',
    'ബുധൻ',
    'വ്യാഴം',
    'വെള്ളി',
    'ശനി',
];

const daysShort = [
    'ഞാ',
    'തി',
    'ചൊ',
    'ബു',
    'വ്യാ',
    'വെ',
    'ശ',
];

const ml: Locale = {
    ...enIN,
    code: 'ml',
    localize: {
        ...enIN.localize,
        month: (n, options) => {
            // n is index 0-11
            // For Malayalam, we generally use full names even for abbreviations 
            // as consistent abbreviations aren't standard.
            return months[n];
        },
        day: (n, options) => {
            // n is index 0-6 (Sunday is 0)
            const width = options?.width || 'wide';
            if (width === 'narrow' || width === 'short') {
                return daysShort[n];
            }
            return days[n];
        },
        ordinalNumber: (n, options) => {
            // Malayalam usually uses number.
            return String(n);
        }
    },
    options: {
        ...enIN.options,
        weekStartsOn: 1, // Monday
    }
};

export { ml };
