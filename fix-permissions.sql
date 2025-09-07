-- Supabaseテーブルアクセス権限の修正
-- Row Level Security (RLS) ポリシーを設定して、すべてのテーブルにアクセス可能にする

-- vehicles テーブル
DROP POLICY IF EXISTS "Enable all for vehicles" ON vehicles;
CREATE POLICY "Enable all for vehicles" 
ON vehicles 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- vacation_settings テーブル
DROP POLICY IF EXISTS "Enable all for vacation_settings" ON vacation_settings;
CREATE POLICY "Enable all for vacation_settings" 
ON vacation_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- holidays テーブル
DROP POLICY IF EXISTS "Enable all for holidays" ON holidays;
CREATE POLICY "Enable all for holidays" 
ON holidays 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- vacation_notifications テーブル
DROP POLICY IF EXISTS "Enable all for vacation_notifications" ON vacation_notifications;
CREATE POLICY "Enable all for vacation_notifications" 
ON vacation_notifications 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- drivers テーブル（念のため）
DROP POLICY IF EXISTS "Enable all for drivers" ON drivers;
CREATE POLICY "Enable all for drivers" 
ON drivers 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- vacation_requests テーブル（念のため）
DROP POLICY IF EXISTS "Enable all for vacation_requests" ON vacation_requests;
CREATE POLICY "Enable all for vacation_requests" 
ON vacation_requests 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- temporary_assignments テーブル（念のため）
DROP POLICY IF EXISTS "Enable all for temporary_assignments" ON temporary_assignments;
CREATE POLICY "Enable all for temporary_assignments" 
ON temporary_assignments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- inspection_schedules テーブル（念のため）
DROP POLICY IF EXISTS "Enable all for inspection_schedules" ON inspection_schedules;
CREATE POLICY "Enable all for inspection_schedules" 
ON inspection_schedules 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- vehicle_operation_statuses テーブル（念のため）
DROP POLICY IF EXISTS "Enable all for vehicle_operation_statuses" ON vehicle_operation_statuses;
CREATE POLICY "Enable all for vehicle_operation_statuses" 
ON vehicle_operation_statuses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- vehicle_assignment_changes テーブル（念のため）
DROP POLICY IF EXISTS "Enable all for vehicle_assignment_changes" ON vehicle_assignment_changes;
CREATE POLICY "Enable all for vehicle_assignment_changes" 
ON vehicle_assignment_changes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- departure_times テーブル（念のため）
DROP POLICY IF EXISTS "Enable all for departure_times" ON departure_times;
CREATE POLICY "Enable all for departure_times" 
ON departure_times 
FOR ALL 
USING (true) 
WITH CHECK (true);

SELECT 'RLSポリシーの設定が完了しました。' as result;