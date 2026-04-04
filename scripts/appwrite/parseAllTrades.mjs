import fs from 'fs';

const rawTrades = `962	Additive Manufacturing Technician Three D Painting
400	Additive Manufacturing Technician Three D Printing (NSQF)
1001	ADVANCED CNC MACHINING TECHNICIAN (NSQF)
401	Aeronautical Structure and Equipment Fitter (NSQF)
402	Agro Processing (NSQF)
990	Architectural Draughtsman (NSQF)
1036	Artificial Intelligence Programming Assistant (NSQF)
1004	ARTISAN USING ADVANCED TOOL (NSQF)
406	Attendant Operator (Chemical Plant) (NSQF)
407	Baker and Confectioner (NSQF)
408	Bamboo Works (NSQF)
1005	BASIC DESIGNER AND VIRTUAL VERIFIER (MECHANICAL) (NSQF)
415	Catering & Hospitality Assistant (NSQF)
996	CENTRAL AIRCONDITION PLANT MECHANIC(NSQF)
416	Civil Engineer Assistant (NSQF)
417	Computer Aided Embroidery And Designing (NSQF)
1035	Computer Aided Manufacturing (CAM) Programmer (NSQF)
418	Computer Hardware & Network Maintenance (NSQF)
1030	Computer Operator & Programming Assistant (VI & OD) (NSQF)
242	Computer Operator and Programming Assistant
421	Computer Operator and Programming Assistant (NSQF)
409	Cosmetology (NSQF)
1031	Cutting & Sewing (VI & OD) (NSQF)
100	Dairying
993	Dairying(NSQF)
427	Data Base System Assistant (NSQF)
1012	Data Entry Operator (NSQF)
430	Dental Laboratory Equipment Technician (NSQF)
431	Desk Top Publishing Operator (NSQF)
1032	Desktop Publishing Operator (VI & OD) (NSQF)
432	Desktop Publishing Operator (VI) (NSQF)
433	Digital Photographer (NSQF)
435	Domestic Painter (NSQF)
436	Draftsman Civil (NSQF)
991	Draughtsman (Civil) (NSQF)
439	Draughtsman (Mechanical) (NSQF)
440	Dress Making (NSQF)
1011	Driver Cum Mechanic (NSQF)
1029	Drone Pilot ( Junior) (NSQF)
1021	Drone Technician(NSQF)
544	Early Childhood Educator
986	Early Childhood Educator(NSQF)
231	Electrician
442	Electrician (NSQF)
444	Electrician Power Distribution (NSQF)
446	Electronics Mechanic (NSQF)
233	Electroplater
447	Electroplater (NSQF)
1016	Event Management Assitant (NSQF)
449	Fashion Design & Technology (NSQF)
1017	Fibre to Home Technician (NSQF)
450	Finance Executive (NSQF)
451	Fire Technology and Industrial Safety Management (NSQF)
452	Firemen (NSQF)
227	Fitter
453	Fitter (NSQF)
455	Floriculture & Landscaping (NSQF)
456	Food & Beverages Services Assistant (NSQF)
457	Food Beverage (NSQF)
458	Food Production (General) (NSQF)
459	Footwear maker (NSQF)
214	Foundryman
460	Foundryman (NSQF)
461	Front Office Assistant (NSQF)
462	Fruit and Vegetable Processor (NSQF)
463	Geo Informatics Assitant (NSQF)
1028	Geriatric (Old Age) Care (NSQF)
1033	Hair & Skin Care (VI & OD) (NSQF)
466	Health Safety & Environment (NSQF)
467	Health Sanitary Inspector (NSQF)
468	Horticulture (NSQF)
921	Horticulture (P)
470	Hospital House Keeping (NSQF)
471	House Keeper (NSQF)
472	Human Resource Executive (NSQF)
1019	In Plant Logistics Assistant (NSQF)
473	Industrial Painter (NSQF)
1006	INDUSTRIAL ROBOTICS AND DIGITAL MANUFACTURING TECHNICIAN (NSQF)
474	Information Communication Technology System Maintenance (NSQF)
475	Information Technology (NSQF)
478	Instrument Mechanic (Chemical Plant) (NSQF)
477	Instrument Mechanic (NSQF)
926	Interior Decoration and Designing (P)
481	Interior Design & Decoration (NSQF)
987	IoT Technician (Smart Agriculture)(NSQF)
965	IoT Technician (Smart City)(NSQF)
988	IoT Technician (Smart healthcare)(NSQF)
485	Laboratory Assistant (Chemical Plant) (NSQF)
487	Leather Goods Maker (NSQF)
490	Lift and Escalator Mechanic (NSQF)
929	Lift Mechanic (P)
494	Machinist (Grinder) (NSQF)
493	Machinist (NSQF)
495	Maintenance Mechanic (Chemical Plant) (NSQF)
1007	MANUFACTURING PROCESS CONTROL AND AUTOMATION (NSQF)
496	Marine Engine Fitter (NSQF)
497	Marine Fitter (NSQF)
498	Marketing Executive (NSQF)
499	Mason (Building Constructor) (NSQF)
502	Mechanic (Motor Vehicle) (NSQF)
504	Mechanic (Tractor) (NSQF)
505	Mechanic Agriculture Machinery (NSQF)
507	Mechanic Auto Body Painting (NSQF)
508	Mechanic Auto Body Repair (NSQF)
509	Mechanic Auto Electrical and Electronics (NSQF)
513	Mechanic Consumer Electronics Appliances (NSQF)
515	Mechanic Diesel (NSQF)
1002	MECHANIC ELECTRIC VEHICLE (NSQF)
517	Mechanic Lens/Prism Grinding (NSQF)
518	Mechanic Machine Tool Maintenance (NSQF)
519	Mechanic Mechatronics (NSQF)
521	Mechanic Mining Machinery (NSQF)
985	Mechanic Two & Three Wheeler (NSQF)
527	Metal Cutting Attendant (VI) (NSQF)
994	Milk & Milk Product Technician (NSQF)
530	Multimedia Animation & Special Effects (NSQF)
535	Operator Advanced Machine Tools (NSQF)
536	Painter General (NSQF)
539	Photographer (NSQF)
540	Physiotherapy Technician (NSQF)
541	Plastic Processing Operator (NSQF)
543	Plumber (NSQF)
547	Pump Operator-Cum-Mechanic (NSQF)
1003	Radiology - Technician (NSQF)
548	Radiology Technician (NSQF)
998	REFRIGERATION AND AIR CONDITIONING TECHNICIAN(NSQF)
553	Secretarial Practice (English) (NSQF)
554	Sewing Technology (NSQF)
555	Sheet Metal Worker (NSQF)
557	Smartphone Technician Cum App Tester (NSQF)
1013	Smartphone Technician Cum App Tester (NSQF)
558	Software Testing Assistant (NSQF)
559	Soil Testing and Crop Technician (NSQF)
561	Solar Technician (Electrical) (NSQF)
560	Solar Technician (NSQF)
562	Spa Therapy (NSQF)
563	Spinning Technician (NSQF)
564	Stenographer & Secretarial Assistant (English) (NSQF)
565	Stenographer & Secretarial Assistant (Hindi) (NSQF)
566	Stone Mining Machine Operator (NSQF)
567	Stone Processing Machine Operator (NSQF)
568	Surface Ornamentation Techniques (Embroidery) (NSQF)
207	Surveyor
970	Surveyor (NSQF)
974	Surveyor (Two Years)
1027	Technician Electronics System Design and Repair (NSQF)
570	Technician Mechatronics (NSQF)
995	TECHNICIAN MEDICAL ELECTRONICS(NSQF)
571	Technician Power Electronics System (NSQF)
572	Textile Mechatronics (NSQF)
573	Textile Wet Processing Technician (NSQF)
574	Tool & Die Maker (Dies & Moulds) (NSQF)
229	Tool & Die Maker (Press Tools, Jigs & Fixtures)
575	Tool & Die Maker (Press Tools, Jigs & Fixtures) (NSQF)
576	Tourist Guide (NSQF)
577	Travel & Tour Assistant (NSQF)
578	Turner (NSQF)
579	Vessel Navigator (NSQF)
1018	Warehouse Technician (NSQF)
581	Weaving Technician (NSQF)
582	Weaving Technician for Silk & Woolen Fabrics (NSQF)
312	Welder
586	Welder (Fabrication & Fitting) (NSQF)
992	Welder (GMAW & GTAW) (NSQF)
969	Welder (NSQF)
588	Welder (Pipe) (NSQF)
589	Welder (Structural) (NSQF)
590	Welder (Welding & Inspection) (NSQF)
592	Wireman (NSQF)
1020	Wood Work Technic`;

const trades = rawTrades.split('\n').map(line => {
    const parts = line.split('\t');
    if (parts.length < 2) return null;
    
    const code = parts[0].trim();
    let name = parts[1].trim();
    
    // Remove NSQF suffix
    name = name.replace(/\(NSQF\)/gi, '').trim();
    
    // Duration rules (2 years for core trades)
    let duration = 1;
    const coreKeywords = [
        'Electrician', 'Fitter', 'Machinist', 'Turner', 'Mechanic (Motor Vehicle)', 
        'Instrument Mechanic', 'Electronics Mechanic', 'Computer Operator', 'COPA', 
        'Information Technology', 'Civil Engineer Assistant', 'Surveyor (Two Years)',
        'Tool & Die Maker'
    ];
    
    if (coreKeywords.some(kw => name.toLowerCase().includes(kw.toLowerCase()))) {
        duration = 2;
    }
    
    return {
        tradeCode: code,
        tradeName: name,
        duration: duration,
        description: `Official ITI training course in ${name} covering practical skills and industry standards.`,
        isActive: true
    };
}).filter(t => t !== null);

fs.writeFileSync('all_trades_dataset.json', JSON.stringify(trades, null, 2));
console.log(`Successfully parsed ${trades.length} trades.`);
