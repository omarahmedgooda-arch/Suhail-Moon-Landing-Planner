// The two casts. Student mode: the team's six comic astronauts (the "moon landing" crew from the
// team's favourite sketch show, drawn by the team). Expert mode: five original specialists whose
// FIELD and temperament were inspired by real Arab space scientists and astronauts. Their dialogue
// is invented; it is never presented as words of the real people.
//
// Figures: team-made art in src/assets/cast/<mode>/<id>-<pose>.webp (poses: explain, idea, warn, portrait).
// To swap which picture belongs to which character, change FIGURE_OF below. Nothing else depends on it.
//
// Card photos of the real inspirations are NOT bundled (we do not copy people's photos from the web).
// Drop a licensed or team-taken photo at public/inspired/<file> (file names below) and the card shows it.

import { CHARACTERS, GUIDE, LEADER, ORDER } from './characters.js';

/** mood → pose */
export const POSE_OF_MOOD = { happy: 'explain', thinking: 'idea', confused: 'idea', nervous: 'idea', worried: 'portrait', asleep: 'portrait' };

/* ------------------------------------------------------------------ STUDENT cast */
const STUDENT = {
  sunlight: { name: 'Hagras', role: 'Solar radiation', meaning: 'the crew’s “power expert”', quirk: 'Thinks a giant flashlight can replace the Sun.', name_ar: 'هجرس', role_ar: 'الإشعاع الشمسي', meaning_ar: '«خبير الطاقة» بتاع الطاقم', quirk_ar: 'فاكر إن كشاف كبير ممكن يعوّض الشمس.' },
  night: { name: 'Dr. Rabie', role: 'Thermal & day cycle', meaning: 'the crew’s “doctor of heat”', quirk: 'Wants to open the windows when it gets cold.', name_ar: 'د. ربيع', role_ar: 'الحرارة والليل والنهار', meaning_ar: '«دكتور الحرارة» بتاع الطاقم', quirk_ar: 'عايز يفتح الشبابيك لما الجو يبرد.' },
  comms: { name: 'Am Ba’zaq', role: 'Earth communication', meaning: 'the shuttle driver, hates the radio', quirk: 'Plans to shout really loudly toward Earth.', name_ar: 'عم بعزق', role_ar: 'الاتصال بالأرض', meaning_ar: 'سوّاق المكوك، وبيكره الراديو', quirk_ar: 'ناوي يزعّق بصوت عالي ناحية الأرض.' },
  terrain: { name: 'Hazalqum', role: 'Terrain slope', meaning: 'the crew’s impulsive pilot', quirk: 'Wants to land wherever it looks “interesting”.', name_ar: 'حزلقوم', role_ar: 'ميل الأرض', meaning_ar: 'الطيار المتهوّر بتاع الطاقم', quirk_ar: 'عايز ينزل في أي حتة شكلها «حلو».' },
  science: { name: 'Ashraf', role: 'Scientific target', meaning: 'came for the trip, not the science', quirk: 'Happy to land next to any random rock.', name_ar: 'أشرف', role_ar: 'الهدف العلمي', meaning_ar: 'جاي يتفسح مش يذاكر', quirk_ar: 'مبسوط ينزل جنب أي صخرة والسلام.' },
};
const STUDENT_LEADER = { id: 'leader', name: 'The Wise Doctor', role: 'Mission expert', meaning: 'the calm one who fixes everything', name_ar: 'الدكتور الحكيم', role_ar: 'خبير المهمة', meaning_ar: 'الهادي اللي بيصلّح كل حاجة' };

/* ------------------------------------------------------------------ EXPERT cast */
// Names are Arabic sky names, like Suhail itself. Inspirations chosen by the team.
export const EXPERT = {
  terrain: {
    name: 'Dr. Badr', meaning: 'Badr = the full Moon', role: 'Surface geologist · terrain lead',
    name_ar: 'د. بدر', meaning_ar: 'البدر = القمر المكتمل', role_ar: 'جيولوجي السطح · مسؤول التضاريس',
    voice_ar: 'أكبر الحاضرين سنًّا. يتكلم ببطء وبجمل قصيرة واثقة، ويثق في الأرض أكثر من أي نموذج. رأى مركبات تنقلب ولا يريد أن يرى ذلك مرة أخرى.',
    cares_ar: 'الميل، والصخور، ومنطقة هبوط مستوية، ومسار اقتراب نظيف.', redLine_ar: 'يرفض أي موقع يتجاوز ميله الحد، مهما كانت الشمس فيه.', risk_ar: 'منخفض', argues_ar: 'من الخبرة والسوابق.',
    voice: 'The elder of the room. Speaks slowly, in short certain sentences, and trusts the ground more than any model. Has seen landers fall over and does not want to see it again.',
    cares: 'Slope, boulders, a level pad, a clean approach path.', redLine: 'Will veto any site where the slope is over the limit, whatever the sunlight.',
    risk: 'Low', argues: 'From experience and precedent.',
    inspired: { who: 'Farouk El-Baz', where: 'Egypt / USA', who_ar: 'فاروق الباز', where_ar: 'مصر / الولايات المتحدة', what_ar: 'جيولوجي عمل مع ناسا في برنامج أبولو، وساعد في اختيار مواقع الهبوط على القمر وتدريب رواد الفضاء على جيولوجيا القمر.', what: 'Geologist who worked with NASA on the Apollo programme, helping select lunar landing sites and training astronauts in lunar geology.', photo: 'el-baz.jpg', source: { label: 'Wikipedia – Farouk El-Baz', url: 'https://en.wikipedia.org/wiki/Farouk_El-Baz' } },
  },
  sunlight: {
    name: 'Tariq', meaning: 'at-Tariq = the morning star', role: 'Power systems engineer · solar lead',
    name_ar: 'طارق', meaning_ar: 'الطارق = نجم الصباح', role_ar: 'مهندس أنظمة الطاقة · مسؤول الطاقة الشمسية',
    voice_ar: 'شاب سريع، والأرقام عنده أولًا. يتكلم بالواط والساعات والكيلوواط ساعة، ويفقد صبره مع أي شيء لا يمكن قياسه.',
    cares_ar: 'ساعات الشمس، وإنتاج الألواح، وهامش الطاقة، وشحن البطارية.', redLine_ar: 'لا لأي موقع تصل فيه البطارية إلى حد التفريغ الأدنى.', risk_ar: 'متوسط', argues_ar: 'من ميزان الطاقة.',
    voice: 'Young, quick, numbers first. Talks in watts, hours and kilowatt-hours, and gets impatient with anything that cannot be measured.',
    cares: 'Sunlit hours, array output, energy margin, battery state of charge.', redLine: 'No site where the battery hits its depth-of-discharge floor.',
    risk: 'Medium', argues: 'From the energy balance.',
    inspired: { who: 'Sultan Alneyadi', where: 'United Arab Emirates', who_ar: 'سلطان النيادي', where_ar: 'الإمارات العربية المتحدة', what_ar: 'رائد فضاء قضى ستة أشهر في محطة الفضاء الدولية عام 2023، ونفّذ أول سير في الفضاء لرائد فضاء عربي، لتجهيز المحطة لترقية ألواحها الشمسية.', what: 'Astronaut who flew a six-month ISS mission in 2023 and made the first spacewalk by an Arab astronaut, preparing the station for its solar-array power upgrade.', photo: 'alneyadi.jpg', photoCredit: 'Photo: NASA', photoCredit_ar: 'الصورة: ناسا', source: { label: 'NASA – Astronauts begin spacewalk to upgrade station power (28 Apr 2023)', url: 'https://www.nasa.gov/blogs/spacestation/2023/04/28/astronauts-begin-spacewalk-to-upgrade-station-power/' } },
  },
  night: {
    name: 'Dr. Thuraya', meaning: 'ath-Thuraya = the Pleiades', role: 'Thermal engineer · night-survival lead',
    name_ar: 'د. ثريا', meaning_ar: 'الثريا = عنقود نجوم معروف', role_ar: 'مهندسة حرارية · مسؤولة الصمود ليلًا',
    voice_ar: 'دقيقة وعنيدة بهدوء. تفكر بالكلفن وبأسوأ الاحتمالات، وتسأل في كل مرة: «وماذا يحدث في أطول ساعة ظلام؟»',
    cares_ar: 'أطول فترة ظلام، ومدى حرارة السطح، وقدرة المدفئات، وتحمّل البطارية.', redLine_ar: 'لا ظلام أطول من تحمّل البطارية مع أحمال الليل.', risk_ar: 'منخفض', argues_ar: 'من تحليل أسوأ الحالات.',
    voice: 'Precise and quietly stubborn. Thinks in kelvin and in worst cases; asks “and what happens in the longest dark hour?” every single time.',
    cares: 'Longest darkness, surface temperature range, heater power, battery endurance.', redLine: 'No darkness longer than the battery endurance on the night-time load.',
    risk: 'Low', argues: 'From worst-case analysis.',
    inspired: { who: 'Tahani Amer', where: 'Egypt / USA', who_ar: 'تهاني عامر', where_ar: 'مصر / الولايات المتحدة', what_ar: 'مهندسة في ناسا نشأت قرب القاهرة والتحقت بناسا عام 1992، وعملت في ديناميكا الموائع الحسابية وتجارب أنفاق الرياح بدهانات حساسة للضغط والحرارة، ولها براءة اختراع لنظام يقيس التوصيل الحراري للأغشية الرقيقة.', what: 'NASA engineer who grew up near Cairo and joined NASA in 1992, working on computational fluid dynamics and wind-tunnel tests with pressure- and thermal-sensitive paint; she patented a system for measuring the thermal conductivity of thin films.', photo: 'amer.jpg', photoCredit: 'Photo: NASA', photoCredit_ar: 'الصورة: ناسا', source: { label: 'NASA – Tahani Amer', url: 'https://www.nasa.gov/people/tahani-amer' } },
  },
  comms: {
    name: 'Nasr', meaning: 'an-Nasr = the eagle stars (Vega, Altair)', role: 'Communications officer · link lead',
    name_ar: 'نسر', meaning_ar: 'النسر = نجما النسر الواقع والطائر', role_ar: 'ضابط الاتصالات · مسؤول الاتصال',
    voice_ar: 'هادئ ورسمي وخبير في الإجراءات. يقيس كل شيء بالاتصال مع الأرض، ويذكّر الجميع بأن المركبة التي لا يسمعها أحد مركبة ضائعة.',
    cares_ar: 'ظهور الأرض، وأطول انقطاع، وتوجيه الهوائي، وحجم البيانات.', redLine_ar: 'لا انقطاع أطول من الحد أثناء العمليات الحرجة.', risk_ar: 'منخفض', argues_ar: 'من الإجراءات والاحتياط.',
    voice: 'Calm, formal, a veteran of procedures. Measures everything against the link to Earth and reminds the room that a lander nobody can hear is a lander that is lost.',
    cares: 'Earth in view, longest blackout, antenna pointing, data volume.', redLine: 'No blackout longer than the limit during critical operations.',
    risk: 'Low', argues: 'From procedure and redundancy.',
    inspired: { who: 'Sultan bin Salman Al Saud', where: 'Saudi Arabia', who_ar: 'سلطان بن سلمان آل سعود', where_ar: 'المملكة العربية السعودية', what_ar: 'اختصاصي حمولة في رحلة المكوك STS-51-G (يونيو 1985)، وأول عربي وأول مسلم يصعد إلى الفضاء؛ وأطلق الطاقم خلالها قمر الاتصالات عربسات 1B.', what: 'Payload specialist on Space Shuttle mission STS-51-G (June 1985), the first Arab and first Muslim in space; the crew deployed the Arabsat-1B communications satellite.', photo: 'sultan-bin-salman.jpg', photoCredit: 'Photo: NASA', photoCredit_ar: 'الصورة: ناسا', source: { label: 'Wikipedia – STS-51-G', url: 'https://en.wikipedia.org/wiki/STS-51-G' } },
  },
  science: {
    name: 'Dr. Saad', meaning: 'Sa‘d = the lucky stars (Sa‘d al-Su‘ud)', role: 'Planetary scientist · science lead',
    name_ar: 'د. سعد', meaning_ar: 'سعد = نجوم السعود', role_ar: 'عالم كواكب · مسؤول العلوم',
    voice_ar: 'متحمس ومقنع. يجرّ الحديث دائمًا نحو الجليد والمصائد الباردة، وهو الأكثر استعدادًا لتقبّل المخاطرة من أجل هدف أفضل.',
    cares_ar: 'المسافة إلى المناطق المظللة دائمًا، واحتمال وجود جليد الماء، وطول الرحلة.', redLine_ar: 'الموقع الآمن البعيد عن الهدف مجرد «موقف سيارات جميل».', risk_ar: 'مرتفع', argues_ar: 'من العائد العلمي.',
    voice: 'Enthusiastic and persuasive. Always pulls the conversation toward the ice and the cold traps, and is the one most willing to accept risk for a better target.',
    cares: 'Distance to permanently shadowed regions, water-ice potential, traverse length.', redLine: 'A safe site too far from the target is “a beautiful parking lot”.',
    risk: 'High', argues: 'From science return.',
    inspired: { who: 'Essam Heggy', where: 'Egypt / USA', who_ar: 'عصام حجي', where_ar: 'مصر / الولايات المتحدة', what_ar: 'عالم كواكب (جامعة جنوب كاليفورنيا ومختبر الدفع النفاث JPL) يستخدم السبر الراداري للبحث عن الماء والجليد تحت أسطح الكواكب ورمال الصحراء.', what: 'Planetary scientist (University of Southern California, NASA JPL) who uses radar sounding to look for water and ice beneath planetary surfaces and desert sand.', photo: 'heggy.jpg', source: { label: 'Heggy Research Group, USC', url: 'https://heggyresearch.usc.edu' } },
  },
};
const EXPERT_LEADER = { id: 'leader', name: 'Hakim', role: 'Flight director', meaning: '“Wise” in Arabic', name_ar: 'حكيم', role_ar: 'مدير الرحلة', meaning_ar: 'من الحكمة' };

/** The cast for a mode: members keyed by aspect id (learn cards are shared), plus guide and leader. */
export function castFor(mode) {
  const src = mode === 'expert' ? EXPERT : STUDENT;
  const members = {};
  for (const a of ORDER) members[a] = { ...CHARACTERS[a], ...src[a], id: a };
  return { mode, members, guide: GUIDE, leader: mode === 'expert' ? { ...LEADER, ...EXPERT_LEADER } : { ...LEADER, ...STUDENT_LEADER } };
}
export { ORDER };
