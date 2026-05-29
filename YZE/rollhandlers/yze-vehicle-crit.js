// YZE yze_vehicle_crit — Critical Vehicle Damage (D12), SRD p.26.
//
// Triggered when a vehicle suffers damage equal to half its Hull rating
// or more in a single hit. Call via:
//   api.roll('1d12', { vehicleName: name }, 'yze_vehicle_crit')
//
// Structure matches yze-crit.js exactly.

var meta        = (data && data.roll && data.roll.metadata) || {};
var dice        = (data && data.roll && data.roll.dice)     || [];
var vehicleName = meta.vehicleName || 'Vehicle';

var result = dice.length > 0 ? parseInt(dice[0].value, 10) : 1;
if (isNaN(result) || result < 1)  result = 1;
if (result > 12) result = 12;

// ── Critical vehicle damage table (D12, SRD p.26) ────────────────────────
var VCRIT = {
  1:  { name: 'Ricochet',
        effect: 'The attack bounces off the vehicle and strikes another random target in the same zone, inflicting the same damage to it.' },
  2:  { name: 'Skid',
        effect: 'The vehicle skids severely. The driver must make an immediate skill roll (not an action) — failure means the driver loses their next turn and is unable to perform any actions.' },
  3:  { name: 'Windshield Shattered',
        effect: 'The windshield is shattered, reducing the Maneuverability of the vehicle by one step.' },
  4:  { name: 'Driver Hit',
        effect: 'The driver is hit and suffers damage equal to the damage inflicted on the vehicle.' },
  5:  { name: 'Passenger Hit',
        effect: 'A random passenger is hit and suffers damage equal to the damage inflicted on the vehicle, and a critical injury. Re-roll if no passengers are present.' },
  6:  { name: 'Wheel Blown',
        effect: 'A wheel or thruster is blown out, giving a -2 modifier to all driving skill rolls.' },
  7:  { name: 'Severe Spin',
        effect: 'The attack rocks the vehicle. The driver must make an immediate skill roll (not an action) — failure means the vehicle crashes and is automatically wrecked. Each passenger then suffers D3 points of falling damage plus one for each zone of altitude, mitigated by the vehicle\'s armor.' },
  8:  { name: 'Fuel Fire',
        effect: 'The vehicle catches fire. The vehicle and everyone inside is exposed to intensity 6 fire.' },
  9:  { name: 'Weapon Disabled',
        effect: 'A random weapon mounted on the vehicle is disabled. Re-roll if no weapons are present.' },
  10: { name: 'Massive Crash',
        effect: 'The vehicle careens out of control and crashes violently. The vehicle is wrecked. Everyone inside suffers D3 points of damage plus one for each zone of altitude.',
        wrecked: true },
  11: { name: 'Engine Disabled',
        effect: 'The engine is disabled. The vehicle cannot move until repaired.' },
  12: { name: 'Explosion',
        effect: 'The vehicle explodes. It is destroyed. Everyone inside suffers damage equal to the vehicle\'s Hull rating. Everyone within Short range suffers half that damage.',
        wrecked: true }
};

var entry = VCRIT[result];

// ── Build chat card (matches yze-crit.js style) ───────────────────────────
var msg = '**[center][color=red]VEHICLE CRITICAL DAMAGE[/color][/center]**';
msg += '\n[center]' + vehicleName + ' — D12: ' + result + '[/center]';
msg += '\n**[center]' + result + '. ' + entry.name + '[/center]**';
msg += '\n[center]' + entry.effect + '[/center]';

if (entry.wrecked) {
  msg += '\n**[center][color=red]VEHICLE WRECKED[/color][/center]**';
}

api.sendMessage(msg, data.roll, [], [{ name: entry.name, tooltip: entry.effect }]);
