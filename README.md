# Checklist Gerencial J. Cruzeiro

Web App mobile-first para registro e auditoria de checklists gerenciais das lojas J. Cruzeiro.

## 🚀 Funcionalidades

- **Autenticação**: Login seguro com Supabase Auth
- **Perfis de usuário**: Admin, Auditor e Gestor
- **Checklists**: Criação e preenchimento de checklists com fotos e justificativas
- **Geolocalização**: Captura automática de localização durante auditorias
- **Dashboard**: KPIs, gráficos e relatórios em tempo real
- **PWA**: Funciona offline e pode ser instalado como app
- **Responsivo**: Design mobile-first com suporte desktop

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: TanStack Query
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **PWA**: Vite PWA Plugin

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## ⚙️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <repository-url>
   cd checklist-gerencial-jcruzeiro
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   ```

4. **Configure o banco de dados**
   
   Execute os seguintes comandos SQL no Supabase SQL Editor:

   ```sql
   -- Criar tabelas
   CREATE TABLE stores (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     nome TEXT NOT NULL,
     slug TEXT NOT NULL UNIQUE,
     ativo BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     nome TEXT NOT NULL,
     email TEXT NOT NULL,
     role TEXT CHECK (role IN ('admin', 'auditor', 'gestor')) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE checklist_versions (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     nome TEXT NOT NULL,
     soma_pesos INTEGER NOT NULL,
     publicado_em TIMESTAMP WITH TIME ZONE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE questions (
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

   CREATE TABLE checklists (
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

   CREATE TABLE answers (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     checklist_id UUID REFERENCES checklists(id),
     question_id UUID REFERENCES questions(id),
     resposta TEXT CHECK (resposta IN ('SIM', 'MEIO', 'NAO')) NOT NULL,
     justificativa TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE media (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     answer_id UUID REFERENCES answers(id),
     file_path TEXT NOT NULL,
     content_type TEXT NOT NULL,
     width INTEGER,
     height INTEGER,
     tamanho INTEGER NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   CREATE TABLE audit_log (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     acao TEXT NOT NULL,
     payload JSONB,
     criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Inserir dados iniciais
   INSERT INTO stores (nome, slug) VALUES
   ('Matriz', 'matriz'),
   ('Catedral', 'catedral'),
   ('Mineiros', 'mineiros'),
   ('Rharo', 'rharo'),
   ('Said Abdala', 'said-abdala'),
   ('Rio Verde', 'rio-verde');

   -- Configurar RLS (Row Level Security)
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
   ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE media ENABLE ROW LEVEL SECURITY;

   -- Políticas RLS
   CREATE POLICY "Users can view own profile" ON users
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Admins can view all users" ON users
     FOR SELECT USING (
       EXISTS (
         SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
       )
     );
   ```

5. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

6. **Acesse a aplicação**
   
   Abra [http://localhost:5173](http://localhost:5173) no navegador

## 🏗️ Build para Produção

```bash
npm run build
npm run preview
```

## 📱 PWA

A aplicação é configurada como PWA e pode ser instalada em dispositivos móveis:

1. Acesse a aplicação no navegador móvel
2. Toque no menu do navegador
3. Selecione "Adicionar à tela inicial" ou "Instalar app"

## 🔧 Configuração do Supabase

### Storage

Crie um bucket chamado `checklist-media` para armazenar fotos:

1. Vá para Storage no painel do Supabase
2. Crie um novo bucket: `checklist-media`
3. Configure as políticas de acesso conforme necessário

### Edge Functions (Opcional)

Para geração de PDFs, você pode implementar Edge Functions:

```bash
supabase functions new generate-pdf
```

## 📊 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
├── contexts/           # Contextos React (Auth, etc.)
├── lib/               # Configurações e utilitários
├── pages/             # Páginas da aplicação
├── types/             # Tipos TypeScript
└── main.tsx           # Ponto de entrada
```

## 🔐 Perfis de Usuário

- **Admin**: Gerencia perguntas, usuários e configurações
- **Auditor**: Realiza checklists nas lojas
- **Gestor**: Visualiza dashboards e relatórios

## 📈 Funcionalidades Principais

### Checklist
- Seleção de loja
- Captura de geolocalização
- Perguntas com pesos configuráveis
- Respostas: SIM (100%), 1/2 (50%), NÃO (0%)
- Justificativas obrigatórias para respostas ≠ SIM
- Upload de fotos como evidência
- Cálculo automático de pontuação

### Dashboard
- KPIs principais
- Gráficos por loja e categoria
- Top falhas
- Filtros por período
- Drill-down para detalhes

### Relatórios
- Exportação em PDF
- Compartilhamento via Web Share API
- Template timbrado
- Anexo de fotos selecionadas

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é propriedade da J. Cruzeiro.

## 📞 Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento.