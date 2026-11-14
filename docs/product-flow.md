# SUHAIL · Product flow (source of truth)

Written by a teammate of the FASA Destination Team. The Arabic original is kept verbatim at the
bottom. This English version is what the code implements. If the two ever disagree, ask the author.

## English version

When the user opens the website they see **two options**:

1. **Start a new mission**
2. **Replan an old mission**

### A. New mission

1. **Assessment form.** The user enters everything they need: the type of trip (for example a
   science trip), and the requirements that cover the **five aspects** (for example: power
   must not fall below X, sunlight must not fall below Y, and so on). The analysis later
   runs on these requirements.
2. The user presses **Create mission**.
3. A **Moon map** appears. The places that fit the requirements are highlighted on it. A
   **guide character** says something like: "After seeing your requirements, here are the best
   5 places for your trip. Let's look at each one."
4. The guide takes the user **place by place, in order**. In the first place:
   - the character in charge of **sunlight** likes the place a lot, finds it suitable and explains
     why it is special;
   - the character in charge of **terrain** says no, this place is not suitable, there is too much
     rough terrain for your trip, and is upset and annoyed;
   - and so on for **all 5 characters**.
5. When the first place is done, the guide takes the user to the second place. Again the
   5 characters discuss it. This repeats until **all 5 candidate places** are done.
6. Then the **leader character** appears. The leader gives a **quick comparison** between the
   places. Being wise, the leader says **which place is the best to land on and why**, and shows
   the **data that confirms it**: every detail, the numbers for the five aspects, the **suitable
   date and time for the trip**, and so on.
7. When that is finished, SUHAIL produces **one file that collects all this data** (the report).

### B. Replan an old mission

1. **Assessment form** for replanning: the user enters the **old mission's data**, the **reasons
   for replanning**, and the **new terms / requirements**.
2. The user presses **Replan**.
3. The **same process** runs: map with candidate places, the guide, five places one by one with
   the five characters, the leader's comparison and verdict, and the report file.

## How the code maps to this (keep in sync)

| Spec step | Where it lives |
|---|---|
| Landing: new / replan | `src/app/Screens.jsx` → `Home` |
| Assessment form (new) | `src/app/Screens.jsx` → `NewMission`, fields in `src/app/Forms.jsx` |
| Assessment form (replan) | `src/app/Screens.jsx` → `ReplanMission` (+ `defaultReplan`), fields in `src/app/Forms.jsx` |
| Moon map with candidates | `src/app/Screens.jsx` → `MapStage`, drawing in `src/components/MapViews.jsx` (`PoleMap`) |
| Guide + 5 characters, place by place | `src/app/Council.jsx` (lines from `src/engine/banter.js` → `placeScript`) |
| Leader verdict + data | `src/app/Verdict.jsx` (lines from `banter.js` → `leaderScript`; tables in `src/app/Numbers.jsx`) |
| Report file | `src/engine/report.js` (`buildReportHtml`, `buildReportJson`) |
| Ranking, best window, replan diff | `src/engine/rules.js`, `src/engine/plan.js` |
| Navigation / state | `src/App.jsx` |

Student mode and Expert mode share this flow and the same look. Student mode uses presets
(fewer fields, plain words). Expert mode exposes every limit and weight.

---

## النص الأصلي (عربي)

طيب بص هكتبلك وصف كامل للي انا عاوزاه انا عاوزة لما اليوزر يفتح الويب سايت يبقى قدامه ٢ اوبشن اول حاجة انه يبدأ mission جديدة او يعيد تخطيط mission قديمة

لو داس على mission جديدة يظهرله زي assessment form يدخل فيها كل الداتا اللي هوا عايزها زي مثلا نوع الرحلة دي رحلة علمية وعايزة الطاقة في المكان متقلش عن كذا وضوء الشمس ميقلش عن كذا وكل الrequirments اللي هوا عايزها في الرحلة تكون مغطية الجوانب المطلوبة كانوا تقريبا خمس جوانب عشان بعد كده هنعمل اناليسز بناءا على ال requirements دي بعد ما يدخل ال requirements يدوس create mission هتظهرله مثلا خريطة القمر ومتحدد عليها الأماكن المرشحة بناءا على ال requirements دي و character تقوله بعد ما شوفنا ال requirements بتاعتك دي أفضل مثلا ٥ اماكن مناسبة لرحلتك بس تعالى نشوف كل مكان وبعد كده تاخده على مكان مكان بالترتيب مثلا اول مكان يدخلها فيلقي ان ال character اللي مسؤولة عن ضوء الشمس عاجبها المكان ده جدا وشايفاه مناسب وتبدأ تشرحله هيا ليه شايفاه مميز بينما مثلا ال character اللي مسؤولة عن التضاريس تقوله لا المكان ده مش مناسب عشان تضاريس كتير مش هتناسب رحلتك وتبقى زعلانة ومتضايقة وهكذا في ال٥ characters وبعد ما يخلص اول مكان ال character اللي بتوجهه تاخده على المكان التاني ويحصل بردو نقاش بين ال 5 characters وهكذا لحد ما يخلص ال ٥ اماكن المرشحة يظهر ال leader character ويعمله مقارنة سريعة بين الأماكن وبما انه شخص حكيم فيقول انه افضل مكان تهبط فيه هوا ده ويقوله ليه ويظهرله الداتا اللي بتاكد ده فيها كل التفاصيل وأرقام الجوانب الخمسة والمعاد المناسب للرحلة وهكذا وبعد ما يخلص يعملها ملف يجمع كل الداتا دي

ده كده اول موود تاني مود هوا إعادة تخطيط mission لما يدوس عليها هيظهرله assessment form يدخل البيانات القديمة للرحلة وأسباب إعادة التخطيط والمصطلحات الجديدة اللي عايزها ولما يخلص يدوس زرار replan ويمشي نفس ال process هتظهرله مثلا خريطة القمر ومتحدد عليها الأماكن المرشحة بناءا على ال requirements دي و character تقوله بعد ما شوفنا ال requirements بتاعتك دي أفضل مثلا ٥ اماكن مناسبة لرحلتك بس تعالى نشوف كل مكان وبعد كده تاخده على مكان مكان بالترتيب مثلا اول مكان يدخلها فيلقي ان ال character اللي مسؤولة عن ضوء الشمس عاجبها المكان ده جدا وشايفاه مناسب وتبدأ تشرحله هيا ليه شايفاه مميز بينما مثلا ال character اللي مسؤولة عن التضاريس تقوله لا المكان ده مش مناسب عشان تضاريس كتير مش هتناسب رحلتك وتبقى زعلانة ومتضايقة وهكذا في ال٥ characters وبعد ما يخلص اول مكان ال character اللي بتوجهه تاخده على المكان التاني ويحصل بردو نقاش بين ال 5 characters وهكذا لحد ما يخلص ال ٥ اماكن المرشحة يظهر ال leader character ويعمله مقارنة سريعة بين الأماكن وبما انه شخص حكيم فيقول انه افضل مكان تهبط فيه هوا ده ويقوله ليه ويظهرله الداتا اللي بتاكد ده فيها كل التفاصيل وأرقام الجوانب الخمسة والمعاد المناسب للرحلة وهكذا وبعد ما يخلص يعملها ملف يجمع كل الداتا دي
