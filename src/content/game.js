// "Save the Mission" – the Student mode game. Static content, no data needed.
// Each round: one crew member makes a silly suggestion (one of the three options), the player picks.
// kind: 'silly' (the crew member's idea), 'good' (correct), 'bad' (another wrong idea).

export const GAME_MISSIONS = [
  { id: 'rover', name: 'Ice Hunter Rover', blurb: 'Drive to the edge of a frozen crater and look for water ice.', name_ar: 'روفر صياد الجليد', blurb_ar: 'سوق لحد حافة حفرة متجمدة ودوّر على جليد المية.', icon: '🛞' },
  { id: 'lab', name: 'Solar Science Lab', blurb: 'A small lab that runs experiments for two weeks on solar power.', name_ar: 'معمل العلوم الشمسي', blurb_ar: 'معمل صغير بيعمل تجارب لمدة أسبوعين على الطاقة الشمسية.', icon: '🔬' },
  { id: 'relay', name: 'Signal Station', blurb: 'A radio station that keeps future astronauts in touch with Earth.', name_ar: 'محطة الإشارة', blurb_ar: 'محطة راديو بتخلي رواد الفضاء الجايين على اتصال بالأرض.', icon: '📡' },
];

export const GAME_ROUNDS_V2 = [
  {
    aspect: 'terrain', meter: 'Stability', title: 'Where do we touch down?',
    meter_ar: 'الثبات', title_ar: 'هننزل فين؟',
    silly: 'Look at all those big rocks and craters! It looks AMAZING. Let’s land right there!',
    silly_ar: 'بص على الصخور والحفر دي كلها! المنظر تحفة. يلا ننزل هناك على طول!',
    options: [
      { kind: 'silly', text: 'The crater edge full of boulders', text_ar: 'حافة الحفرة اللي مليانة صخور', scene: 'boulders' },
      { kind: 'good', text: 'A wide flat plain with gentle slopes', text_ar: 'سهل واسع ومستوي ومنحدراته خفيفة', scene: 'flat' },
      { kind: 'bad', text: 'The steep side of a mountain', text_ar: 'جنب جبل منحدر جامد', scene: 'steep' },
    ],
    win: 'Smooth touchdown! Flat ground keeps all four legs on the surface.',
    win_ar: 'هبوط ناعم! الأرض المستوية بتخلي الأرجل الأربعة على السطح.',
    lose: { silly: 'CRUNCH. A leg hit a boulder and the lander tipped over, just like Odysseus in 2024.', bad: 'The lander slid down the slope and fell on its side.' },
    lose_ar: { silly: 'طاخ! رجل خبطت في صخرة والمركبة اتقلبت، زي أوديسيوس سنة 2024 بالظبط.', bad: 'المركبة اتزحلقت على المنحدر ووقعت على جنبها.' },
    hint: 'A lander is tall and narrow like a stool. What kind of floor does a stool need?',
    hint_ar: 'المركبة طويلة ورفيعة زي الكرسي البار. الكرسي ده محتاج أرضية شكلها إيه؟',
  },
  {
    aspect: 'sunlight', meter: 'Power', title: 'Where do we put the solar panels?',
    meter_ar: 'الطاقة', title_ar: 'نحط الألواح الشمسية فين؟',
    silly: 'Who needs the Sun? I packed a giant flashlight! Let’s park in the dark crater.',
    silly_ar: 'مين محتاج الشمس؟ أنا جايب كشاف كبير! يلا نركن في الحفرة الضلمة.',
    options: [
      { kind: 'silly', text: 'At the bottom of a dark crater (bring a flashlight)', text_ar: 'في قاع حفرة ضلمة (وهات الكشاف)', scene: 'darkcrater' },
      { kind: 'bad', text: 'Right behind a tall mountain', text_ar: 'ورا جبل عالي على طول', scene: 'shadow' },
      { kind: 'good', text: 'On a high ridge that sees the Sun most of the time', text_ar: 'فوق حافة عالية بتشوف الشمس أغلب الوقت', scene: 'ridge' },
    ],
    win: 'Panels are glowing! At the pole the Sun skims the horizon, so high ground catches the light.',
    win_ar: 'الألواح منورة! عند القطب الشمس واطية على الأفق، فالأماكن العالية هي اللي بتلقط النور.',
    lose: { silly: 'The flashlight runs on… the batteries. Which need the Sun. The screens go black.', bad: 'The mountain’s shadow covers the panels for days. Power drops to zero.' },
    lose_ar: { silly: 'الكشاف شغال على… البطاريات. اللي محتاجة الشمس. الشاشات طفت.', bad: 'ضل الجبل غطى الألواح أيام. الطاقة وصلت صفر.' },
    hint: 'Near the south pole the Sun stays very low. Do high places or low places see it?',
    hint_ar: 'قرب القطب الجنوبي الشمس بتفضل واطية جدًا. الأماكن العالية ولا الواطية هي اللي بتشوفها؟',
  },
  {
    aspect: 'night', meter: 'Heat', title: 'The night is coming. Brrr!',
    meter_ar: 'الحرارة', title_ar: 'الليل جاي. بررر!',
    silly: 'It’s getting cold? Easy! We open the windows and let the warm air in!',
    silly_ar: 'الجو بيبرد؟ بسيطة! نفتح الشبابيك ونخلي الهوا الدافي يدخل!',
    options: [
      { kind: 'bad', text: 'Ignore it, electronics don’t feel cold', text_ar: 'طنّش، الإلكترونيات مبتحسش بالبرد', scene: 'ignore' },
      { kind: 'good', text: 'Pick a spot with short nights, and keep heaters on the battery', text_ar: 'اختار مكان ليله قصير، وشغّل الدفايات على البطارية', scene: 'heater' },
      { kind: 'silly', text: 'Open the windows for some warm air', text_ar: 'افتح الشبابيك علشان شوية هوا دافي', scene: 'window' },
    ],
    win: 'Toasty inside! Short dark spells mean the battery and heaters can carry us to sunrise.',
    win_ar: 'دافي جوه! الضلمة القصيرة معناها إن البطارية والدفايات يقدروا يوصلونا لحد الشروق.',
    lose: { silly: 'There is no air on the Moon, warm or cold. Everything freezes in minutes!', bad: 'At about −170 °C the batteries freeze and the computer stops. Mission over.' },
    lose_ar: { silly: 'مفيش هوا على القمر أصلًا، لا دافي ولا بارد. كل حاجة اتجمدت في دقايق!', bad: 'على حوالي 170 تحت الصفر البطاريات اتجمدت والكمبيوتر وقف. المهمة خلصت.' },
    hint: 'The Moon has no air. What keeps electronics warm when there is no Sun?',
    hint_ar: 'القمر مفيهوش هوا. إيه اللي يدفّي الإلكترونيات لما مفيش شمس؟',
  },
  {
    aspect: 'comms', meter: 'Signal', title: 'How do we talk to Earth?',
    meter_ar: 'الإشارة', title_ar: 'هنكلم الأرض إزاي؟',
    silly: 'Radio? Pfff. If we lose the signal I’ll just SHOUT really loud toward Earth!',
    silly_ar: 'راديو؟ يا عم! لو الإشارة قطعت هزعّق بصوت عالي أوي ناحية الأرض!',
    options: [
      { kind: 'good', text: 'A spot where Earth is above the hills most of the time', text_ar: 'مكان الأرض فيه باينة فوق التلال أغلب الوقت', scene: 'earthview' },
      { kind: 'silly', text: 'Behind a big hill, and shout if needed', text_ar: 'ورا تل كبير، ونزعّق لو احتجنا', scene: 'hill' },
      { kind: 'bad', text: 'Deep inside a crater', text_ar: 'جوه حفرة عميقة', scene: 'pit' },
    ],
    win: 'Loud and clear! Radio travels in straight lines, so we need Earth in sight.',
    win_ar: 'الصوت واصل وواضح! الراديو بيمشي في خطوط مستقيمة، فلازم الأرض تكون باينة.',
    lose: { silly: 'Sound can’t travel through space. Earth hears nothing, and the hill blocks the radio too.', bad: 'The crater walls block Earth completely. No commands, no data home.' },
    lose_ar: { silly: 'الصوت مبيمشيش في الفضاء. الأرض مسمعتش حاجة، والتل كمان قطع الراديو.', bad: 'حيطان الحفرة حجبت الأرض خالص. لا أوامر جاية ولا بيانات رايحة.' },
    hint: 'Radio waves go in straight lines, like light. Can you see Earth from there?',
    hint_ar: 'موجات الراديو بتمشي في خط مستقيم زي النور. شايف الأرض من هناك؟',
  },
  {
    aspect: 'science', meter: 'Science', title: 'What are we here to study?',
    meter_ar: 'العلم', title_ar: 'إحنا جايين ندرس إيه؟',
    silly: 'Science? Boring! Let’s land next to any random rock and take selfies.',
    silly_ar: 'علم؟ ممل! يلا ننزل جنب أي صخرة ونتصور سيلفي.',
    options: [
      { kind: 'bad', text: 'Inside the frozen crater itself (dark and −230 °C)', text_ar: 'جوه الحفرة المتجمدة نفسها (ضلمة و230 تحت الصفر)', scene: 'icecrater' },
      { kind: 'silly', text: 'Next to any random rock', text_ar: 'جنب أي صخرة والسلام', scene: 'rock' },
      { kind: 'good', text: 'A safe spot near a frozen crater that may hold water ice', text_ar: 'مكان آمن قريب من حفرة متجمدة ممكن يكون فيها جليد مية', scene: 'nearice' },
    ],
    win: 'Jackpot! Close enough to reach the ice, safe enough to stay alive.',
    win_ar: 'جبتها! قريبين كفاية نوصل للجليد، وآمنين كفاية نفضل عايشين.',
    lose: { silly: 'Nice selfies… but the mission learned nothing. The scientists are not amused.', bad: 'Too dark and too cold to survive. The rover never wakes up.' },
    lose_ar: { silly: 'السيلفي حلو… بس المهمة متعلمتش أي حاجة. العلماء مش مبسوطين خالص.', bad: 'ضلمة وبرد زيادة عن اللزوم. الروفر عمره ما صحي تاني.' },
    hint: 'We want the ice, but we also want to survive. Near it, or inside it?',
    hint_ar: 'إحنا عايزين الجليد، بس كمان عايزين نعيش. جنبه ولا جواه؟',
  },
];

export const GAME_DOCTOR = {
  intro: 'Welcome, Commander. This crew means well… mostly. Every time one of them has an idea, you decide. Keep all five gauges up and the mission survives!',
  good: ['Excellent decision, Commander!', 'That is exactly what a real mission planner would do.', 'Science wins again!'],
  bad: ['Oh no… let me explain what went wrong.', 'That one hurt. Let’s learn from it.', 'Hmm. The Moon is not forgiving.'],
  intro_ar: 'أهلًا يا قائد المهمة. الطاقم ده نيته كويسة… غالبًا. كل ما حد فيهم يجيب فكرة، إنت اللي تقرر. حافظ على المؤشرات الخمسة فوق، والمهمة تعيش!',
  good_ar: ['قرار ممتاز يا قائد!', 'ده بالظبط اللي مخطِّط مهمة حقيقي كان هيعمله.', 'العلم كسب تاني!'],
  bad_ar: ['لا لا… خليني أشرحلك إيه اللي غلط.', 'دي وجعت. يلا نتعلم منها.', 'همم. القمر مبيسامحش.'],
};

const METER_AR = { Stability: 'الثبات', Power: 'الطاقة', Heat: 'الحرارة', Signal: 'الإشارة', Science: 'العلم' };

export function gameResult(meters, lang = 'en') {
  const low = Object.entries(meters).filter(([, v]) => v < 50).map(([k]) => k);
  if (lang === 'ar') {
    const n = low.map((k) => METER_AR[k] ?? k);
    if (!low.length) return { ok: true, title: 'المهمة اتنقذت!', text: 'كل الأنظمة شغالة. سيطرت على أفكار الطاقم واخترت زي فريق اختيار مواقع الهبوط الحقيقي.' };
    if (low.length <= 2) return { ok: false, title: 'المهمة بتعرج', text: `المركبة عاشت، بس ${n.join(' و')} وقع. جزء من العلم ضاع.` };
    return { ok: false, title: 'المهمة ضاعت', text: `أنظمة كتير وقعت (${n.join('، ')}). متقلقش: الفرق الحقيقية بتتعلم بنفس الطريقة. جرّب تاني!` };
  }
  if (!low.length) return { ok: true, title: 'Mission saved!', text: 'Every system is green. You kept the crew’s ideas under control and chose like a real landing-site team.' };
  if (low.length <= 2) return { ok: false, title: 'Mission limping', text: `The lander survived, but ${low.join(' and ')} failed. Part of the science was lost.` };
  return { ok: false, title: 'Mission lost', text: `Too many systems failed (${low.join(', ')}). Don’t worry: real teams learn the same way. Try again!` };
}
