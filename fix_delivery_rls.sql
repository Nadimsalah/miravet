ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Delivery men can view their assigned orders" ON public.orders;
CREATE POLICY "Delivery men can view their assigned orders" ON public.orders FOR SELECT TO authenticated USING (delivery_man_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'ACCOUNT_MANAGER')));

DROP POLICY IF EXISTS "Delivery men can update their assigned orders" ON public.orders;
CREATE POLICY "Delivery men can update their assigned orders" ON public.orders FOR UPDATE TO authenticated USING (delivery_man_id = auth.uid()) WITH CHECK (delivery_man_id = auth.uid());

DROP POLICY IF EXISTS "Delivery men can view order items of their orders" ON public.order_items;
CREATE POLICY "Delivery men can view order items of their orders" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.delivery_man_id = auth.uid()));

DROP POLICY IF EXISTS "Delivery men can view logs for their assigned orders" ON public.order_status_logs;
CREATE POLICY "Delivery men can view logs for their assigned orders" ON public.order_status_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_logs.order_id AND orders.delivery_man_id = auth.uid()));

DROP POLICY IF EXISTS "Delivery men can insert logs for their assigned orders" ON public.order_status_logs;
CREATE POLICY "Delivery men can insert logs for their assigned orders" ON public.order_status_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.delivery_man_id = auth.uid()));
