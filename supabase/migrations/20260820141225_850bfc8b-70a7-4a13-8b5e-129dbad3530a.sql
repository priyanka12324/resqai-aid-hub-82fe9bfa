-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('citizen', 'responder', 'admin');
CREATE TYPE public.disaster_type AS ENUM ('flood', 'earthquake', 'landslide', 'fire', 'cyclone');
CREATE TYPE public.severity_level AS ENUM ('critical', 'high', 'moderate', 'low');
CREATE TYPE public.report_status AS ENUM ('new', 'verified', 'dispatched', 'resolved');
CREATE TYPE public.sos_status AS ENUM ('pending', 'acknowledged', 'dispatched', 'resolved');
CREATE TYPE public.facility_kind AS ENUM ('shelter', 'relief-camp', 'hospital');

-- ============ SHARED TRIGGER FN ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_operator(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('responder', 'admin')
  );
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- new users get a profile + citizen role automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ FACILITIES ============
CREATE TABLE public.facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  kind public.facility_kind NOT NULL,
  name TEXT NOT NULL,
  location_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 0,
  occupied INTEGER NOT NULL DEFAULT 0,
  beds_available INTEGER NOT NULL DEFAULT 0,
  icu_available INTEGER NOT NULL DEFAULT 0,
  triage_load TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  amenities TEXT[] NOT NULL DEFAULT '{}',
  contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.facilities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.facilities TO authenticated;
GRANT ALL ON public.facilities TO service_role;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "facilities_public_read" ON public.facilities FOR SELECT USING (true);
CREATE POLICY "facilities_operator_write" ON public.facilities FOR ALL TO authenticated
  USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE TRIGGER facilities_updated_at BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ REPORTS ============
CREATE SEQUENCE public.report_code_seq START 1043;
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL DEFAULT ('RPT-' || nextval('public.report_code_seq')),
  user_id UUID,
  type public.disaster_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_name TEXT NOT NULL,
  district TEXT NOT NULL DEFAULT 'Unassigned',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  severity public.severity_level NOT NULL DEFAULT 'moderate',
  status public.report_status NOT NULL DEFAULT 'new',
  people_affected INTEGER NOT NULL DEFAULT 0,
  immediate_danger TEXT NOT NULL DEFAULT 'unknown',
  image_url TEXT,
  ai_summary TEXT,
  ai_recommended_action TEXT,
  ai_hazards TEXT[] NOT NULL DEFAULT '{}',
  ai_actions TEXT[] NOT NULL DEFAULT '{}',
  ai_priority_score INTEGER NOT NULL DEFAULT 0,
  ai_confidence NUMERIC(3,2) NOT NULL DEFAULT 0.75,
  ai_risk_level TEXT,
  ai_affected_area TEXT,
  ai_simulated BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reports TO anon;
GRANT SELECT, INSERT, UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_public_read" ON public.reports FOR SELECT USING (true);
CREATE POLICY "reports_insert_signed_in" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "reports_operator_update" ON public.reports FOR UPDATE TO authenticated
  USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE INDEX reports_created_at_idx ON public.reports (created_at DESC);
CREATE INDEX reports_severity_idx ON public.reports (severity);
CREATE INDEX reports_status_idx ON public.reports (status);
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ SOS ALERTS ============
CREATE TABLE public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  emergency_type TEXT NOT NULL,
  message TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  accuracy_m DOUBLE PRECISION,
  status public.sos_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.sos_alerts TO authenticated;
GRANT ALL ON public.sos_alerts TO service_role;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sos_select_own_or_operator" ON public.sos_alerts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_operator(auth.uid()));
CREATE POLICY "sos_insert_own" ON public.sos_alerts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "sos_operator_update" ON public.sos_alerts FOR UPDATE TO authenticated
  USING (public.is_operator(auth.uid())) WITH CHECK (public.is_operator(auth.uid()));
CREATE INDEX sos_created_at_idx ON public.sos_alerts (created_at DESC);
CREATE TRIGGER sos_updated_at BEFORE UPDATE ON public.sos_alerts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_alerts;

-- ============ SEED: FACILITIES ============
INSERT INTO public.facilities (code, kind, name, location_name, lat, lng, capacity, occupied, beds_available, icu_available, triage_load, status, amenities, contact) VALUES
('SHL-01','shelter','Sector 21 Municipal School Shelter','Central Dehradun, near water tank', 30.32496, 78.0398, 500, 120, 0, 0, 'normal', 'open', ARRAY['Medical desk','Dry rations','Women & child zone','Power backup'], '+91 90000 11021'),
('SHL-02','shelter','Riverside Community Hall','Dehradun East, Ward 4', 30.33712, 78.02144, 300, 240, 0, 0, 'normal', 'filling', ARRAY['Drinking water','Blankets','Pet-friendly'], '+91 90000 11022'),
('SHL-03','relief-camp','North Hills Relief Camp','North Hills, Bypass Junction', 30.36144, 78.08672, 200, 200, 0, 0, 'normal', 'full', ARRAY['Tented housing','Kitchen'], '+91 90000 11023'),
('SHL-04','shelter','South Zone Stadium Shelter','South Zone, Gate 2', 30.2824, 78.03776, 900, 240, 0, 0, 'normal', 'open', ARRAY['Medical desk','Sanitation block','Accessible ramps','Charging points'], '+91 90000 11024'),
('SHL-05','relief-camp','Old Bridge Transit Camp','East Zone, riverside approach', 30.33256, 78.01532, 150, 0, 0, 0, 'normal', 'closed', ARRAY['Closed — inside flood zone'], '+91 90000 11025'),
('HSP-01','hospital','City General Hospital','Central, Ring Road', 30.33104, 78.05408, 0, 0, 42, 6, 'busy', 'open', ARRAY['Trauma','Orthopaedics','Paediatrics'], '+91 90000 22001'),
('HSP-02','hospital','Riverside Trauma Centre','East Zone, Bridge Approach', 30.33408, 78.0092, 0, 0, 8, 1, 'overloaded', 'open', ARRAY['Trauma','Emergency surgery'], '+91 90000 22002'),
('HSP-03','hospital','Hillside Mission Hospital','North Hills, KM-9', 30.37968, 78.0908, 0, 0, 27, 4, 'normal', 'open', ARRAY['General medicine','Fracture care'], '+91 90000 22003');

-- ============ SEED: LIVE INCIDENT REPORTS ============
INSERT INTO public.reports (code, type, title, description, location_name, district, lat, lng, severity, status, people_affected, immediate_danger, ai_summary, ai_recommended_action, ai_hazards, ai_actions, ai_priority_score, ai_confidence, ai_risk_level, ai_affected_area, ai_simulated, created_at) VALUES
('RPT-1042','flood','Riverbank breach flooding residential lanes','Water rose above knee level in under an hour. Around 40 families are stranded on upper floors near the old bridge.','Rispana Riverside Colony, Dehradun','Dehradun East', 30.34624, 78.01328, 'critical','new',180,'yes','Multiple corroborating reports plus rising gauge readings indicate an active levee breach with fast-moving water.','Move to the second floor or higher, avoid all road travel, and wait for boat evacuation from the north lane.', ARRAY['Fast-moving water','Submerged roads','Electrical hazard in water'], ARRAY['Move to higher ground or an upper floor immediately.','Avoid flooded roads and never cross moving water.','Head toward the nearest available elevated shelter.'], 94, 0.94, 'High — life safety risk','Approx. 2.5 km radius around Rispana Riverside Colony', true, now() - interval '28 minutes'),
('RPT-4818','landslide','Hillside slip blocking access road','Slope collapsed after continuous rain. Two vehicles trapped, no injuries reported yet.','Ghat Road KM-14','North Hills', 30.3736, 78.07852, 'high','verified',24,'yes','Image analysis shows unstable debris above the roadway; secondary slides are likely within 12 hours.','Keep 200m clear of the slope face and route traffic via the Sector 7 bypass.', ARRAY['Unstable debris','Blocked access road','Further slope failure'], ARRAY['Move away from the slope face and keep a safe distance.','Use the marked bypass route to reach a relief camp.','Report any new cracks or ground movement.'], 78, 0.88, 'Elevated — urgent assistance needed','Approx. 1.2 km radius around Ghat Road KM-14', true, now() - interval '1 hour'),
('RPT-4812','earthquake','Structural cracks after 5.1 tremor','Visible cracks along load-bearing walls in a four-storey apartment block. Residents evacuated to the street.','Sector 21 Housing Board','Central', 30.31736, 78.04592, 'high','verified',96,'no','Damage pattern consistent with moderate shaking; building requires structural assessment before re-entry.','Do not re-enter the building. Assemble at the school ground shelter for structural clearance.', ARRAY['Structural cracks','Falling debris','Aftershock risk'], ARRAY['Do not re-enter damaged buildings.','Assemble at the nearest open-ground shelter.','Shut off gas supply if a leak is suspected.'], 72, 0.81, 'Elevated — urgent assistance needed','Approx. 1.2 km radius around Sector 21 Housing Board', true, now() - interval '2 hours'),
('RPT-4806','flood','Storm drain overflow in market street','Ankle-deep water across the market, shops closing early.','Gandhi Market','South Zone', 30.29152, 78.0296, 'moderate','new',60,'no','Localised urban flooding from drain blockage; no life-threat signals detected.','Avoid the underpass, use elevated footpaths, report electrical hazards.', ARRAY['Submerged roads','Contaminated water'], ARRAY['Avoid flooded roads and never cross moving water.','Report electrical hazards to the control room.'], 48, 0.72, 'Moderate — monitor closely','Localised near Gandhi Market', true, now() - interval '3 hours'),
('RPT-4799','fire','Warehouse fire with heavy smoke','Smoke drifting into nearby residential blocks; two units on scene.','Industrial Estate Gate 3','West Zone', 30.30976, 77.98472, 'moderate','dispatched',35,'no','Contained perimeter reported; air-quality risk downwind for approximately 1km.','Close windows, use a damp cloth mask, keep the east lane clear for engines.', ARRAY['Dense smoke','Air-quality risk'], ARRAY['Move upwind and away from the smoke plume.','Cover your face with a damp cloth.'], 44, 0.77, 'Moderate — monitor closely','Localised near Industrial Estate Gate 3', true, now() - interval '4 hours'),
('RPT-4790','cyclone','Coastal wind damage to temporary shelters','Roof sheets torn off along the fishing settlement.','Marine Line Settlement','Coastal', 30.28544, 78.10304, 'low','resolved',18,'no','Damage assessed as non-structural; relief material already dispatched.','Collect tarpaulin kits from the ward office relief desk.', ARRAY['High winds'], ARRAY['Shelter in a reinforced building away from windows.'], 22, 0.69, 'Low — informational','Localised near Marine Line Settlement', true, now() - interval '12 hours');