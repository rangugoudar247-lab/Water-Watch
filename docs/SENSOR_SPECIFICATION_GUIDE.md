# Practical Sensor Specifications & Water Distribution Telemetry Guide
**Water Watch Bengaluru — Engineering Technical Reference**

---

## 1. Overview of Sensor Types, Capabilities, and Physical Limitations

In municipal distribution systems like Bengaluru (BWSSB network), real-time online monitoring is critical for early warning. However, sensor physics dictates strict boundaries between what can be monitored continuously online versus what requires accredited laboratory testing.

| Parameter | Sensor Technology | Measurement Range & Accuracy | Real-Time Feasibility | Limitations & Maintenance Constraints | Typical Unit Cost (INR) |
|---|---|---|---|---|---|
| **Water Pressure** | Piezoresistive Ceramic / Stainless Steel Diaphragm | 0 to 10 bar (0–100 m w.c.); ±0.25% FS | **High (Continuous online)** | Susceptible to water hammer; requires syphon loop/snubber. Low maintenance, 3–5 yr life. | ₹12,000 – ₹25,000 |
| **Flow Rate** | Electromagnetic Flowmeter (Full bore / Insertion) | 0.1 to 10 m/s; ±0.5% reading | **High (Continuous online)** | Requires full pipe flow and straight run (5D upstream, 2D downstream). Insertion types can foul with debris. | ₹65,000 – ₹2,50,000 |
| **Turbidity** | Optical 90° Nephelometric Near-IR (ISO 7027 / EPA 180.1) | 0 to 100 NTU; ±2% or 0.05 NTU | **Moderate to High** | Optical window gets fouled by bio-film and iron scaling; requires wiper or periodic manual cleaning (bi-weekly). | ₹75,000 – ₹1,80,000 |
| **Free Residual Chlorine** | Amperometric Membrane or Colorimetric DPD Flow-through | 0 to 5.0 mg/L; ±0.05 mg/L | **Moderate** | Membrane fouling, pH and temperature cross-sensitivity. Requires zero/span calibration every 14–30 days. Reagents required for DPD. | ₹1,20,000 – ₹3,20,000 |
| **pH** | Glass Electrode / Solid-state ISFET | 2.0 to 12.0 pH; ±0.1 pH | **High** | Glass bulb dehydrates if water supply is cut off (intermittent supply problem!). Requires buffer recalibration monthly. | ₹25,000 – ₹60,000 |
| **Water Level** | Hydrostatic Pressure Transmitter or Ultrasonic | 0 to 10 meters; ±0.5% FS | **High (Reservoirs/OHTs)** | Ultrasonic can suffer condensation on transducer face; hydrostatic requires breather tube desiccant check. | ₹20,000 – ₹45,000 |
| **Pump Status** | Current Transformer (CT) + Auxiliary relay contact | 0–100 A / Digital RUN/STOP/TRIP | **High (Immediate)** | Indicates electrical state, not hydraulic discharge (pump could run dry/cavitate). Combine with flowmeter. | ₹5,000 – ₹15,000 |

---

## 2. What Online Sensors CAN and CANNOT Detect

### What Online Sensors CAN Detect (Early Indicators):
1. **Hydraulic Surges and Pressure Collapses**: Piezoresistive pressure transmitters detect sudden drops indicating pipeline rupture or negative pressure creating back-siphonage ingress.
2. **Bulk Suspended Solids / Silt Ingress**: Optical turbidity sensors immediately flag particulate matter caused by main line scouring, construction damage, or muddy surface water inflow.
3. **Disinfection Breakdown**: Free chlorine amperometric sensors flag chlorine decay when water has traveled too far, booster dosing failed, or high organic contaminant load consumes free chlorine.
4. **Leakage & Unaccounted Consumption**: Dual flowmeters on District Metered Areas (DMAs) identify Minimum Night Flow (MNF) anomalies indicative of background leakage.

### What Online Sensors CANNOT Detect (Requires Lab Analysis):
1. **Microbiological Pathogens**: Direct detection of *Escherichia coli*, *Salmonella*, *Vibrio cholerae*, and *Giardia* cysts cannot be done by standard online sensors. It requires membrane filtration, incubation, or PCR testing (24–48 hours).
2. **Toxic Heavy Metals & Chemical Contaminants**: Trace Lead, Arsenic, Chromium, Nitrates, and Pesticides require Atomic Absorption Spectroscopy (AAS) or Inductively Coupled Plasma Mass Spectrometry (ICP-MS) in an accredited laboratory.
3. **Emerging Organic Pollutants & Endocrine Disruptors**: Requires Gas Chromatography-Mass Spectrometry (GC-MS).

> **CRITICAL ARCHITECTURAL RULE**: Normal readings on a turbidity and chlorine sensor do **not** guarantee that water is 100% microbiologically and chemically safe. The system displays sensor parameters truthfully with explicit data provenance and never marks water as "Officially Certified Safe" without signed laboratory verification.

---

## 3. Communication, Power, and Deployment Architecture

1. **Connectivity**:
   - **Cellular NB-IoT / 4G-LTE**: Preferred for urban street inspection chambers and valve pits in Bengaluru due to ubiquitous telecom coverage.
   - **LoRaWAN**: Suitable for clusters around Master Balancing Reservoirs (MBRs) and Ground Level Reservoirs (GLRs) where gateway can be mounted on reservoir towers.
2. **Power Architecture**:
   - For GLRs and booster pump houses: Grid power with UPS / battery backup.
   - For underground valve chambers and street monitoring nodes: Solar micro-panel with lithium iron phosphate (LiFePO4) 12V battery or 5-year primary D-cell lithium batteries with sleep-wake duty cycling (e.g. transmit every 5 minutes during supply hours, every 30 minutes off-hours).
3. **Environmental Ingress Protection**:
   - Underground chambers in Bengaluru are prone to monsoon flooding and sewage dampness: Minimum **IP68** submersible enclosure rating for all field sensors and cable glands.

