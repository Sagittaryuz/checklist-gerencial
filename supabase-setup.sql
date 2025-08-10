-- Checklist Gerencial J. Cruzeiro - Database Setup
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabelas
CREATE TABLE IF NOT EXISTS stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'auditor', 'gestor')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklist_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  soma_pesos INTEGER NOT NULL,
  publicado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id UUID REFERENCES checklist_versions(id),
  categoria TEXT NOT NULL,
  titulo TEXT NOT NULL,
  peso INTEGER NOT NULL,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  obrigatoria BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checklists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_id UUID REFERENCES checklist_versions(id),
  store_id UUID REFERENCES stores(id),
  user_id UUID REFERENCES users(id),
  data_local TIMESTAMP NOT NULL,
  data_utc TIMESTAMP WITH TIME ZONE NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  acuracia DECIMAL(8, 2),
  sem_gps BOOLEAN DEFAULT false,
  score_total DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_id UUID REFERENCES checklists(id),
  question_id UUID REFERENCES questions(id),
  resposta TEXT CHECK (resposta IN ('SIM', 'MEIO', 'NAO')) NOT NULL,
  justificativa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID REFERENCES answers(id),
  file_path TEXT NOT NULL,
  content_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  tamanho INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  acao TEXT NOT NULL,
  payload JSONB,
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inserir dados iniciais
INSERT INTO stores (nome, slug) VALUES
('Matriz', 'matriz'),
('Catedral', 'catedral'),
('Mineiros', 'mineiros'),
('Rharo', 'rharo'),
('Said Abdala', 'said-abdala'),
('Rio Verde', 'rio-verde')
ON CONFLICT (slug) DO NOTHING;

-- 3. Configurar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- 5. Criar políticas RLS corretas
-- Política para usuários visualizarem seu próprio perfil
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Política para usuários inserirem seu próprio perfil
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Política para admins visualizarem todos os usuários
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Políticas para checklists
CREATE POLICY "Users can view own checklists" ON checklists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checklists" ON checklists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all checklists" ON checklists
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Políticas para answers
CREATE POLICY "Users can view own answers" ON answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own answers" ON answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM checklists c WHERE c.id = checklist_id AND c.user_id = auth.uid()
    )
  );

-- Políticas para media
CREATE POLICY "Users can view own media" ON media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM answers a 
      JOIN checklists c ON c.id = a.checklist_id 
      WHERE a.id = answer_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own media" ON media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM answers a 
      JOIN checklists c ON c.id = a.checklist_id 
      WHERE a.id = answer_id AND c.user_id = auth.uid()
    )
  );

-- Políticas para audit_log
CREATE POLICY "Users can view own audit logs" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs" ON audit_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- 6. Criar função para inserir usuário automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, nome, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'nome', new.email, COALESCE(new.raw_user_meta_data->>'role', 'auditor'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger para executar a função após signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8. Criar versão inicial do checklist
INSERT INTO checklist_versions (nome, soma_pesos, publicado_em) VALUES
('Versão 1.0', 100, NOW())
ON CONFLICT DO NOTHING;

-- 9. Inserir perguntas de exemplo
DO $$
DECLARE
    version_uuid UUID;
BEGIN
    SELECT id INTO version_uuid FROM checklist_versions WHERE nome = 'Versão 1.0' LIMIT 1;
    
    IF version_uuid IS NOT NULL THEN
        INSERT INTO questions (version_id, categoria, titulo, peso, ordem, ativo, obrigatoria) VALUES
        (version_uuid, 'Loja', 'Produtos da campanha disponíveis com amostra, preço e estoque?', 25, 1, true, true),
        (version_uuid, 'Loja', 'Pontas de gôndola abastecidas e com cartazes?', 20, 2, true, true),
        (version_uuid, 'Loja', 'Ilhas promocionais abastecidas e com cartazes?', 25, 3, true, true),
        (version_uuid, 'Loja', 'Impressoras de etiquetas/cartazes funcionando?', 15, 4, true, false),
        (version_uuid, 'Atendimento', 'Funcionários uniformizados e identificados?', 15, 5, true, true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 10. Criar bucket para storage (execute no painel do Supabase Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('checklist-media', 'checklist-media', false);

-- 11. Políticas para storage (execute após criar o bucket)
-- CREATE POLICY "Users can upload own media" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'checklist-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own media" ON storage.objects
--   FOR SELECT USING (bucket_id = 'checklist-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Fim do script
SELECT 'Database setup completed successfully!' as status;