// The five characters (one per aspect) + the guide star. Copy lives here, not in components,
// so an Arabic version can be added later by mirroring this file.

export const SOURCES = {
  apolloSites: { label: 'NASA – 50 Years Ago: Lunar Landing Sites Selected', url: 'https://www.nasa.gov/feature/50-years-ago-lunar-landing-sites-selected' },
  apollo11: { label: 'Science Museum – Apollo 11: the most difficult moments', url: 'https://blog.sciencemuseum.org.uk/apollo-11-moon-landing-the-most-difficult-moments/' },
  odysseus: { label: 'NPR – Odysseus lands sideways on the Moon', url: 'https://www.npr.org/2024/02/23/1233677833/lunar-lander-odysseus-sideways-moon' },
  athena: { label: 'Spaceflight Now – IM-2 mission ends with lander on its side', url: 'https://spaceflightnow.com/2025/03/07/intuitive-machines-im-2-mission-ends-with-lander-on-its-side-on-the-moon/' },
  chandrayaan: { label: 'The New Stack – Chandrayaan-3’s successful Moon landing', url: 'https://thenewstack.io/indias-space-victory-chandrayaan-3s-successful-moon-landing/' },
  coldCraters: { label: 'Space.com – Moon craters could be the coldest place in the solar system', url: 'https://www.space.com/7311-moon-craters-coldest-place-solar-system.html' },
  poleShadows: { label: 'NASA SVS – Shadows near the Moon’s south pole', url: 'https://svs.gsfc.nasa.gov/4893' },
};

export const ORDER = ['sunlight', 'night', 'comms', 'terrain', 'science'];

export const CHARACTERS = {
  sunlight: {
    id: 'sunlight', name: 'Shams', meaning: '“Sun” in Arabic', role: 'Keeper of the Sun',
    job: 'Turns sunlight into electricity.', ask: 'Will my panels get light?', emblem: 'sun',
    learn: {
      title: 'Why sunlight matters',
      title_ar: 'لماذا تهم الشمس', what_ar: 'قرب قطبي القمر تمرّ الشمس ملامسةً للأفق (حسب ناسا: لا ترتفع أو تنخفض عنه أكثر من 1.5°)، فتلقي الجبال وجدران الفوهات ظلالًا طويلة جدًا. والمركبة العاملة بالطاقة الشمسية لا تنتج كهرباء إلا والشمس فوق الأفق الذي تراه.', how_ar: 'يأخذ سهيل موقع الشمس ساعة بساعة، ويقارنه بأفق التضاريس كما يُرى من الموقع، ثم يحسب نسبة الساعات التي تكون فيها الشمس ظاهرة.', real_ar: 'هبطت أثينا (مارس 2025) داخل فوهة قرب جبل موتون وانقلبت على جنبها. ومع اتجاه الشمس وتوجيه الألواح والبرد الشديد، لم تستطع إعادة الشحن، وأُعلن انتهاء المهمة في اليوم التالي.',
      what: 'Near the Moon’s poles the Sun just skims the horizon (NASA: never more than 1.5° above or below it), so mountains and crater walls throw very long shadows. A solar-powered lander only makes electricity while the Sun is above the horizon it sees.',
      how: 'SUHAIL takes the Sun’s position hour by hour, compares it with the terrain horizon seen from the site, and counts the share of hours the Sun is up.',
      real: { text: 'Athena (March 2025) touched down inside a crater near Mons Mouton and ended up on its side. The Sun’s direction, the panels’ orientation and extreme cold meant it could not recharge, and the mission was declared over the next day.', source: SOURCES.athena },
    },
  },
  night: {
    id: 'night', name: 'Dafi', meaning: '“Warm” in Arabic', role: 'Keeper of the heat',
    job: 'Keeps the electronics alive through the lunar night.', ask: 'Can we survive the dark?', emblem: 'snow',
    learn: {
      title: 'Why the dark stretch matters',
      title_ar: 'لماذا تهم فترة الظلام', what_ar: 'قد تختفي الشمس خلف التضاريس لأيام. وأطول فترة ظلام هي المدة التي يجب أن تعيش فيها المركبة على بطاريتها وحدها. فإذا طال الظلام أكثر من تحمّل البطارية، نفدت الطاقة والحرارة.', how_ar: 'يجد سهيل أطول سلسلة متصلة من الساعات بلا شمس، ويقارنها بمدة تحمّل البطارية في مهمتك.', real_ar: 'بعض الفوهات المظللة دائمًا شديدة البرودة: سجّل جهاز Diviner التابع لناسا درجات حرارة أقل من −238 °م في أجزاء منها. وكان متوقعًا أن تعمل أوديسيوس (2024) نحو تسعة أو عشرة أيام فقط قبل حلول الليل القمري.',
      what: 'The Sun can disappear behind the terrain for days. The longest dark stretch is how long the lander must live on its battery alone. If the dark lasts longer than the battery, power and heat run out.',
      how: 'SUHAIL finds the longest unbroken run of hours with no Sun and compares it with the battery time you chose for the mission.',
      real: { text: 'Some permanently shadowed craters are brutally cold: NASA’s Diviner instrument recorded temperatures below −238 °C (−397 °F) in parts of them. And Odysseus (2024) was expected to work for only about nine or ten days before lunar nightfall.', source: SOURCES.coldCraters },
    },
  },
  comms: {
    id: 'comms', name: 'Ishara', meaning: '“Signal” in Arabic', role: 'Signal officer',
    job: 'Keeps the radio link with Earth open.', ask: 'Can we talk to Earth?', emblem: 'wave',
    learn: {
      title: 'Why Earth visibility matters',
      title_ar: 'لماذا تهم رؤية الأرض', what_ar: 'موجات الراديو تسير في خطوط مستقيمة. فإذا وقع تل بين المركبة والأرض انقطع الاتصال. ومن القطبين تظهر الأرض منخفضة قرب الأفق، فتحجبها التضاريس أكثر بكثير مما يحدث عند خط استواء الجانب القريب.', how_ar: 'بالطريقة نفسها المستخدمة مع الشمس: موقع الأرض ساعة بساعة مقابل أفق التضاريس. ونعرض نسبة الساعات التي تُرى فيها الأرض، وأطول انقطاع.', real_ar: 'بعد أن سقطت أوديسيوس (2024) على جنبها، اتجهت بعض هوائياتها المرتفعة نحو الأرض، مما حدّ من كمية البيانات التي استطاع المتحكمون استقبالها.',
      what: 'Radio travels in straight lines. If a hill sits between the lander and Earth, there is no link. From the poles Earth hangs low near the horizon, so terrain blocks it far more often than on the near-side equator.',
      how: 'Same trick as the Sun: Earth’s position hour by hour against the terrain horizon. We report the share of hours Earth is visible and the longest gap without it.',
      real: { text: 'After Odysseus (2024) fell on its side, some of its high-mounted antennas pointed at the ground, which limited how much data controllers could send back.', source: SOURCES.odysseus },
    },
  },
  terrain: {
    id: 'terrain', name: 'Thabit', meaning: '“Steady” in Arabic', role: 'Keeper of the ground',
    job: 'Checks that the lander can stand up straight.', ask: 'Is the ground safe?', emblem: 'slope',
    learn: {
      title: 'Why slope matters',
      title_ar: 'لماذا يهم الميل', what_ar: 'المركبة طويلة وقاعدتها ضيقة، تشبه الكرسي العالي قليلًا. على منحدر شديد أو بجوار صخرة كبيرة قد تنقلب. وقد اشترطت لجنة مواقع أبولو ميلًا عامًا أقل من 2°.', how_ar: 'يقرأ سهيل خريطة ارتفاعات من مقياس LOLA الليزري التابع لناسا ويقيس انحدار الأرض حول الموقع. ودقة الشبكة 80 مترًا للبكسل، لذا لا تظهر فيها الصخور والفوهات الصغيرة.', real_ar: 'نزلت أوديسيوس (2024) بسرعة كبيرة، و«علقت قدمها في السطح» فسقطت على جنبها. وبعد تحطم تشاندرايان-2 عام 2019، وسّعت الهند منطقة هدف تشاندرايان-3 من 500 × 500 متر إلى 4.2 × 2.5 كم، فهبطت قرب القطب الجنوبي في 23 أغسطس 2023.',
      what: 'A lander is tall with a narrow stance, a bit like a stool. On a steep slope, or beside a boulder, it can tip. Apollo’s site board asked for a general slope below 2°.',
      how: 'SUHAIL reads an elevation map from NASA’s LOLA laser altimeter and measures how steep the ground is around the site. The elevation grid is 80 m per pixel, so boulders and small craters do not show up in it.',
      real: { text: 'Odysseus (2024) came in too fast, “caught a foot in the surface” and fell onto its side. After Chandrayaan-2 crashed in 2019, India’s Chandrayaan-3 widened its target area from 500 × 500 m to 4.2 × 2.5 km and landed near the south pole on 23 August 2023.', source: SOURCES.chandrayaan },
    },
  },
  science: {
    id: 'science', name: 'Alim', meaning: '“Scholar” in Arabic', role: 'Ice hunter',
    job: 'Wants to land close to where the science is.', ask: 'Is the ice in reach?', emblem: 'flask',
    learn: {
      title: 'Why distance to the ice matters',
      title_ar: 'لماذا تهم المسافة إلى الجليد', what_ar: 'بعض الفوهات قرب القطبين لا تصلها الشمس أبدًا، وهي باردة بما يكفي لبقاء جليد الماء فيها. والهبوط داخلها مظلم وبارد جدًا، لذا يبحث المخططون عن موقع آمن بالقرب منها، في متناول مركبة جوّالة.', how_ar: 'يقيس سهيل المسافة من الموقع إلى أقرب منطقة مظللة دائمًا. وهي مؤشر على أن «الجليد قد يكون قريبًا»، وليست وعدًا بوجوده.', real_ar: 'قاس جهاز Diviner التابع لناسا درجات أقل من −238 °م في أجزاء من الفوهات المظللة دائمًا، وهذا يدعم فكرة أنها قد تحتفظ بجليد الماء.',
      what: 'Some craters near the poles never see sunlight, and they are cold enough that water ice could survive there. Landing inside is too dark and too cold, so mission planners look for a safe spot NEAR one, within reach of a rover.',
      how: 'SUHAIL measures the distance from the site to the nearest permanently shadowed region. It is a proxy for “ice might be near”, not a promise that ice is there.',
      real: { text: 'NASA’s Diviner measured below −238 °C (−397 °F) in parts of permanently shadowed craters, which supports the idea that they could hold water ice.', source: SOURCES.coldCraters },
    },
  },
};

export const GUIDE = { id: 'guide', name: 'Suhail', meaning: 'the star Canopus', role: 'The guiding star', name_ar: 'سهيل', meaning_ar: 'نجم سهيل', role_ar: 'النجم الهادي' };
export const LEADER = { id: 'leader', name: 'Hakim', meaning: '“Wise” in Arabic', role: 'The wise leader' };
