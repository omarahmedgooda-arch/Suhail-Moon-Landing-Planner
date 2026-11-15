// Student "Lunar Landing Academy": WATCH → LEARN → PLAY. Static content (team spec by Joudy).
// Mission facts are checked against the sources linked on each card.
import { SOURCES } from './characters.js';

// Each story is a short animated sequence told by the Wise Doctor. Every fact is in the linked source.
// scene: which animation StoryScene draws. guess: the student predicts before the reveal.
export const MISSION_STORIES = [
  {
    id: 'odysseus', name: 'Odysseus', name_ar: 'أوديسيوس', code: 'IM-1', year: 2024, survived: '~7 days',
    steps: [
      { scene: 'launch', k: 'February 2024 · Launch', say: 'Meet Odysseus, a lander from the company Intuitive Machines. It is flying to the Moon’s south pole with six NASA payloads on board.', k_ar: 'فبراير 2024 · الإطلاق', say_ar: 'تعرّفوا على أوديسيوس، مركبة هبوط من شركة Intuitive Machines. إنها في طريقها إلى القطب الجنوبي للقمر وعلى متنها ست حمولات من ناسا.' },
      { scene: 'approach', k: 'The target', say: 'Its target: the area near the crater Malapert A. Now it has to come down gently and stand on its four legs.', k_ar: 'الهدف', say_ar: 'هدفها المنطقة القريبة من فوهة مالابرت A. والآن عليها أن تنزل بهدوء وتقف على أرجلها الأربع.' },
      { scene: 'fast', k: 'Your guess', say: 'Uh-oh. Odysseus is coming down faster than planned. What do you think happens next?', k_ar: 'خمّن', say_ar: 'أوه! أوديسيوس تنزل أسرع من المخطط. ماذا تتوقع أن يحدث؟',
        guess: { options: [
          { t: 'It lands perfectly, no problem', t_ar: 'تهبط تمامًا بلا مشاكل', ok: false },
          { t: 'A leg catches the ground and it tips onto its side', t_ar: 'تعلق رجلها في الأرض فتنقلب على جنبها', ok: true },
          { t: 'It bounces back into space', t_ar: 'ترتد عائدة إلى الفضاء', ok: false },
        ] } },
      { scene: 'tip', k: '22 February 2024 · Touchdown', say: 'A landing leg caught the surface, and Odysseus came to rest tilted on its side instead of standing upright.', k_ar: '22 فبراير 2024 · الهبوط', say_ar: 'علقت إحدى أرجل الهبوط في السطح، فاستقرت أوديسيوس مائلة على جنبها بدلًا من أن تقف معتدلة.' },
      { scene: 'side', k: 'What it could still do', say: 'It still sent back data and photos for about seven days. But lying on its side, its antennas, solar power and some payloads could not work as planned.', badge: '~7 days', k_ar: 'ما استطاعت فعله', say_ar: 'ظلت ترسل بيانات وصورًا لمدة سبعة أيام تقريبًا. لكن وهي على جنبها، لم تعمل هوائياتها وطاقتها الشمسية وبعض أجهزتها كما كان مخططًا.', badge: '~7 days', badge_ar: '7 أيام تقريبًا' },
      { scene: 'lesson', k: 'The lesson', say: 'A touchdown is not the same as a working lander. The ground where you land decides what the mission can do afterwards.', k_ar: 'الدرس', say_ar: 'الوصول إلى السطح لا يعني أن المركبة تعمل. الأرض التي تهبط عليها هي التي تحدد ما تستطيع المهمة فعله بعد ذلك.' },
    ],
    source: SOURCES.odysseus,
  },
  {
    id: 'athena', name: 'Athena', name_ar: 'أثينا', code: 'IM-2', year: 2025, survived: '1 day',
    steps: [
      { scene: 'launch', k: '2025 · Launch', say: 'One year later, Intuitive Machines tried again with Athena, its second lander.', k_ar: '2025 · الإطلاق', say_ar: 'بعد عام، حاولت Intuitive Machines مرة أخرى بمركبتها الثانية: أثينا.' },
      { scene: 'approach', k: 'The target', say: 'Athena aimed for Mons Mouton near the south pole. It carried a drill to dig into the soil and look for signs of water ice.', k_ar: 'الهدف', say_ar: 'كانت أثينا تستهدف جبل موتون قرب القطب الجنوبي، وتحمل مثقابًا يحفر في التربة بحثًا عن آثار جليد الماء.' },
      { scene: 'guess-crater', k: 'Your guess', say: 'Athena touches down, but not where it was aiming. Where do you think it ended up?', k_ar: 'خمّن', say_ar: 'هبطت أثينا، لكن ليس في المكان الذي كانت تستهدفه. أين تظن أنها استقرت؟',
        guess: { options: [
          { t: 'Right on top of its flat target', t_ar: 'فوق هدفها المستوي تمامًا', ok: false },
          { t: 'Inside a small crater, lying on its side', t_ar: 'داخل فوهة صغيرة، على جنبها', ok: true },
          { t: 'On the far side of the Moon', t_ar: 'على الجانب البعيد من القمر', ok: false },
        ] } },
      { scene: 'crater', k: '6 March 2025 · Touchdown', say: 'It landed inside a small crater, some distance from its target, and again ended up lying on its side.', k_ar: '6 مارس 2025 · الهبوط', say_ar: 'هبطت داخل فوهة صغيرة على مسافة من هدفها، وانتهى بها الأمر مرة أخرى على جنبها.' },
      { scene: 'cold', k: 'What happened next', say: 'Its solar panels pointed the wrong way. With the Sun very low and the cold so extreme, it could not recharge, and the mission was declared over the next day.', badge: '1 day', k_ar: 'ماذا حدث بعدها', say_ar: 'كانت ألواحها الشمسية موجهة في الاتجاه الخطأ. ومع انخفاض الشمس الشديد والبرد القارس، لم تستطع إعادة الشحن، وأُعلن انتهاء المهمة في اليوم التالي.', badge: '1 day', badge_ar: 'يوم واحد' },
      { scene: 'lesson', k: 'The lesson', say: 'Where you land, the shape of the ground, how the Sun lights it and how cold it gets all decide whether a mission reaches its goals.', k_ar: 'الدرس', say_ar: 'مكان الهبوط، وشكل الأرض، وكيف تضيئها الشمس، ومدى برودتها: كلها تحدد هل تحقق المهمة أهدافها أم لا.' },
    ],
    source: SOURCES.athena,
  },
];

export const ACADEMY_ASPECTS = [
  { id: 'terrain', n: '01', name: 'Terrain & surface safety',
    name_ar: 'التضاريس وأمان السطح', what_ar: 'شكل الأرض: المنحدرات والصخور والحفر والمطبات.', why_ar: 'المركبة محتاجة أرض مستوية وآمنة تقريبًا علشان تنزل من غير ما تتقلب أو تخبط في حاجة.', ignore_ar: 'ممكن تنزل على أرض مش مستوية، أو تخبط في صخرة، أو متبقاش ثابتة، زي أوديسيوس وأثينا بالظبط.', q_ar: 'تختار مكان هبوط مليان صخور كبيرة ومنحدرات جامدة؟', fb_ar: 'صح: الأرض المستوية اللي فيها مخاطر أقل هي الاختيار الأكثر أمانًا.',
    what: 'The shape of the ground: slopes, rocks, craters and bumps.',
    why: 'A lander needs a fairly flat and safe surface so it can touch down without tipping over or hitting obstacles.',
    ignore: 'It may land on uneven ground, hit a boulder or end up unstable, like Odysseus and Athena.',
    q: 'Would you choose a landing site full of big rocks and steep slopes?', a: false,
    fb: 'Right: a fairly flat area with fewer hazards is the safer choice.' },
  { id: 'sunlight', n: '02', name: 'Solar illumination',
    name_ar: 'الإضاءة الشمسية', what_ar: 'قد إيه الشمس بتوصل للمكان، ولمدة قد إيه.', why_ar: 'الألواح الشمسية محتاجة شمس علشان تعمل الكهربا اللي بتشغّل المركبة وأجهزتها.', ignore_ar: 'ممكن المركبة متلاقيش نور كفاية يعمللها الطاقة اللي محتاجاها.', q_ar: 'المكان اللي الشمس فيه قليلة جدًا ينفع دايمًا لمركبة شغالة بالطاقة الشمسية؟', fb_ar: 'صح: لازم نشوف الشمس قبل ما نختار المكان.',
    what: 'How much sunlight reaches the site and for how long.',
    why: 'Solar panels need sunlight to make the electricity that runs the lander and its instruments.',
    ignore: 'The lander may not get enough light to make the power it needs.',
    q: 'Is a place with very little sunlight always a good choice for a solar-powered lander?', a: false,
    fb: 'Right: sunlight has to be checked before choosing the site.' },
  { id: 'night', n: '03', name: 'Thermal environment',
    name_ar: 'البيئة الحرارية', what_ar: 'المكان بيسخن أو يبرد قد إيه، وبيفضل ضلمة لمدة قد إيه.', why_ar: 'الحرارة والبرودة الجامدة على القمر ممكن تبوّظ البطاريات والإلكترونيات والأجهزة.', ignore_ar: 'الأجهزة ممكن تتجمد أو تسخن زيادة وتقف عن الشغل.', q_ar: 'المهندسين يتجاهلوا درجة الحرارة وهما بيختاروا مكان الهبوط؟', fb_ar: 'صح: لازم نحسب حساب الحرارة علشان نحمي المركبة.',
    what: 'How hot or cold the site gets, and how long it stays dark.',
    why: 'Extreme lunar temperatures can damage batteries, electronics and instruments.',
    ignore: 'The equipment may freeze or overheat and stop working.',
    q: 'Should engineers ignore temperature when choosing a landing site?', a: false,
    fb: 'Right: the thermal environment must be considered to protect the spacecraft.' },
  { id: 'comms', n: '04', name: 'Communication & visibility',
    name_ar: 'الاتصال والرؤية', what_ar: 'هل المركبة «شايفة» الأرض علشان تفضل على اتصال بالراديو.', why_ar: 'الاتصال ده هو اللي بيبعت البيانات العلمية للأرض وبيجيب الأوامر للمركبة.', ignore_ar: 'التلال أو شكل القمر ممكن يقطعوا الإشارة، والفريق يفقد الاتصال.', q_ar: 'تختار مكان من غير ما تتأكد إنه يقدر يكلّم الأرض؟', fb_ar: 'صح: لازم نتأكد إن الأرض باينة من المكان.',
    what: 'Whether the lander can “see” Earth to keep a radio link.',
    why: 'The link sends science data home and brings commands to the lander.',
    ignore: 'Hills or the Moon’s shape may block the signal and the team loses contact.',
    q: 'Would you choose a site without checking that it can talk to Earth?', a: false,
    fb: 'Right: communication visibility must be checked.' },
  { id: 'science', n: '05', name: 'Scientific value & resources',
    name_ar: 'القيمة العلمية والموارد', what_ar: 'المكان مهم للعلم قد إيه، زي إنه يكون قريب من حفر ممكن يكون فيها جليد مية.', why_ar: 'المكان لازم يخدم الأهداف العلمية للمهمة.', ignore_ar: 'ممكن المهمة تنزل في مكان آمن بس ملوش أي فايدة للبحث.', q_ar: 'العلماء لازم يفكروا في القيمة العلمية لمكان الهبوط؟', fb_ar: 'صح: المكان المختار لازم يخدم أهداف المهمة العلمية.',
    what: 'How interesting the place is for science, for example close to craters that may hold water ice.',
    why: 'The site has to support the mission’s science goals.',
    ignore: 'The mission may land somewhere safe but useless for its research.',
    q: 'Should scientists think about the science value of a landing site?', a: true,
    fb: 'Right: the chosen site should support the mission’s science goals.' },
];

export const GAME_ROUNDS = [
  { aspect: 'terrain', silly: 'I found a place full of rocks and craters. It looks beautiful! Let’s land here!',
    doctor: 'Wait! We need to check the surface first. A lander needs a fairly stable area with fewer hazards.',
    q: 'What should the Mission Commander do?',
    options: ['Choose a fairly flat area with low slopes and fewer hazards.', 'Land anywhere: the lander can handle everything.', 'Choose the area with the most rocks.'], correct: 0,
    why: 'A fairly flat, less hazardous surface lowers the risk of an unstable landing.' },
  { aspect: 'sunlight', silly: 'Why do we care about sunlight? We’ll just bring a giant flashlight!',
    doctor: 'Solar panels need sunlight to make electricity. We must check how much sunlight reaches the site.',
    q: 'What should the Mission Commander check?',
    options: ['Whether the site gets enough sunlight for the mission’s power needs.', 'Whether the site is completely dark.', 'Whether we can ignore the solar panels.'], correct: 0,
    why: 'Sunlight decides how much electrical energy the lander has.' },
  { aspect: 'night', silly: 'Too cold? Easy! Let’s just open the windows and let some warm air in!',
    doctor: 'The Moon has no air and its temperatures are extreme. We must understand how heat and cold affect our equipment.',
    q: 'What should the Mission Commander do?',
    options: ['Ignore temperature: equipment works in any conditions.', 'Study the thermal environment and its effect on the lander’s systems.', 'Open the windows.'], correct: 1,
    why: 'Temperature affects batteries, electronics and science instruments.' },
  { aspect: 'comms', silly: 'If we lose the signal, we’ll just shout really loudly toward Earth!',
    doctor: 'Sound cannot travel through space. We need to check that the site has a clear radio path to Earth.',
    q: 'What should the Mission Commander check?',
    options: ['Whether hills or the Moon’s shape could block the link to Earth.', 'Whether we can talk to Earth without any radio.', 'Whether we can ignore messages from Earth.'], correct: 0,
    why: 'A clear line of sight to Earth is needed to send data home and receive commands.' },
  { aspect: 'science', silly: 'Let’s land anywhere! We don’t need to study anything!',
    doctor: 'Every mission has science goals. We should choose a site that supports them.',
    q: 'What should the Mission Commander consider?',
    options: ['Whether the site matters for science and supports the research goals.', 'Whether the site is completely random.', 'Whether we can forget the science goals.'], correct: 0,
    why: 'A good landing site gives the mission real science value.' },
];

export function achievement(score) {
  if (score >= 500) return { title: 'Lunar Landing Expert', text: 'Outstanding! You corrected every mistake and guided your team to better landing decisions!' };
  if (score >= 300) return { title: 'Mission Specialist', text: 'Great job! You understand most of the important aspects of choosing a lunar landing site.' };
  return { title: 'Cadet in Training', text: 'Every great scientist starts by learning! Review the five aspects and try the mission again.' };
}

export const DOCTOR_FINAL = 'Congratulations, Mission Commander! You helped the team fix its mistakes and make better decisions. Now you know why choosing the right landing site is one of the most important steps in a successful mission!';
