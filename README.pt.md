# 🛒 Plataforma de Gestão de Supermercados (Marketplace)

🇵🇹 Português · [🇬🇧 English](README.md)

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)
![Swagger](https://img.shields.io/badge/API-Swagger%2FOpenAPI-85EA2D?logo=swagger&logoColor=black)
![Tipo](https://img.shields.io/badge/Tipo-Projeto%20Universit%C3%A1rio-lightgrey)

**Marketplace web full-stack** que liga supermercados, clientes e estafetas. Os clientes exploram supermercados e produtos, montam o carrinho e pagam online; os supermercados gerem o catálogo e as encomendas; os estafetas recolhem e entregam; e um administrador supervisiona toda a plataforma.

O sistema divide-se em duas aplicações que partilham a mesma API:

- **FrontOffice** – aplicação de página única para clientes, construída com **Angular + TypeScript**.
- **BackOffice** – área de gestão renderizada no servidor (Express + EJS) para **administradores, supermercados e estafetas**.

> 🎓 **Contexto académico** – Projeto da unidade curricular de Programação de Aplicações Web, Licenciatura em Engenharia Informática · Março – Junho 2026.
> Desenvolvido para praticar o desenho de um sistema web completo: API REST, autenticação e autorização, base de dados documental, integrações com serviços externos e uma SPA moderna.

---

## ✨ Funcionalidades

### 👤 Cliente (FrontOffice Angular)
- Registo / login com autenticação **JWT**, *route guards* e *HTTP interceptor*.
- Explorar **supermercados** e **produtos**, com ordenação e **mapa interativo (Leaflet)** das lojas.
- **Carrinho**, criação de encomendas, **pagamento online com Stripe Checkout** (modo de teste), acompanhamento e histórico de encomendas.
- Escolha entre **levantamento em loja** ou **entrega ao domicílio**.
- **Favoritos** (produtos e supermercados), **avaliações** de supermercados e estafetas, **notificações** na aplicação.
- Área de conta com perfil e estatísticas pessoais; **tema claro/escuro**.

### 🏪 Supermercado (BackOffice)
- Gestão de **categorias** e **produtos** (imagens por *upload*), stock e encomendas.
- Fluxo de **venda ao balcão** (venda presencial).
- A conta é criada em estado *pendente* e tem de ser **aprovada por um administrador**.

### 🛵 Estafeta (BackOffice)
- Ver **entregas disponíveis**, aceitá-las, acompanhar entregas em curso e histórico.
- Consultar **avaliações** recebidas e **estatísticas** pessoais.

### 🛡️ Administrador (BackOffice)
- Aprovar supermercados pendentes (é enviado um **email de alerta** quando se regista um novo), gerir utilizadores e encomendas e consultar **estatísticas** da plataforma.

### ⚙️ Comportamento da plataforma
- **Ciclo de vida da encomenda:** `Pendente → Confirmada → Em processamento → Em entrega → Entregue` (ou `Cancelada`).
- **Tarefa agendada (node-cron):** as encomendas pendentes não pagas em **5 minutos** são canceladas automaticamente e o **stock é reposto**.
- **Controlo de acessos por perfil** com quatro papéis: `client`, `supermarket`, `courier`, `admin`.
- **Documentação da API** com Swagger UI (`/api-docs`).

## 🧱 Stack tecnológica

| Camada | Tecnologias |
|---|---|
| **FrontOffice** | Angular 21 (componentes *standalone*, rotas com *lazy loading*), TypeScript, RxJS, Angular Material/CDK, Bootstrap 5 + Bootstrap Icons, Leaflet, Dark Reader, Vitest |
| **API / BackOffice** | Node.js, Express 4, EJS, express-session, JWT (`jsonwebtoken`), `bcryptjs`, Multer, node-cron, Nodemailer, Swagger UI |
| **Base de dados** | MongoDB (NoSQL) com Mongoose – coleções de utilizadores, supermercados, categorias, produtos, encomendas, favoritos, avaliações, notificações |
| **Integrações** | Stripe Checkout (pagamentos), email SMTP (Mailtrap / Gmail) |

## 🗂️ Estrutura do projeto

```
.
├── app.js, bin/www        # Aplicação Express e arranque do servidor
├── models/                # Schemas Mongoose
├── controllers/           # Lógica de negócio (encomendas, produtos, supermercados, estafetas, admin, avaliações…)
├── routes/                # Rotas web + API REST (/api)
├── middlewares/           # Autenticação / verificação de perfis
├── views/                 # Templates EJS do BackOffice
├── .env.example           # Environment variables template
├── swagger.json           # Documentação OpenAPI
└── frontoffice/           # SPA Angular
    └── src/app/
        ├── pages/         # dashboard, supermercados, produtos, carrinho, encomendas, favoritos, conta…
        ├── components/    # header, footer, mapa, notificações, avaliações, diálogo de login…
        ├── services/      # auth, carrinho, favoritos, produtos, notificações, tema
        ├── guards/        # AuthGuard
        └── interceptors/  # Interceptor JWT
```

## 🚀 Como executar

**Requisitos:** Node.js 20.19+ (ou 22 LTS), npm e uma instância MongoDB (local ou MongoDB Atlas).

```bash
git clone <url-do-repositório>
cd supermarket-marketplace-platform
```

**1. Backend + BackOffice** (http://localhost:3000)

```bash
npm install
```

Cria o teu ficheiro de ambiente a partir do modelo e preenche com os teus valores (**nunca faças commit do `.env` real**):

```bash
cp .env.example .env
```

| Variável | Finalidade |
|---|---|
| `MONGODB_URI` | String de ligação ao MongoDB (local ou Atlas) – **obrigatória** |
| `JWT_SECRET` / `SESSION_SECRET` | Segredos dos tokens da API e das sessões do BackOffice |
| `STRIPE_SECRET_KEY` | Chave secreta **de teste** do Stripe (`sk_test_...`) para pagamentos online |
| `MAILTRAP_*` / `GMAIL_*` | Credenciais SMTP para emails de notificação (opcional) |

```bash
npm start
```

A documentação da API fica em `http://localhost:3000/api-docs`.

**2. FrontOffice** (http://localhost:4200)

```bash
cd frontoffice
npm install
npm start
```

A SPA espera a API em `http://localhost:3000/api`.

## 🔭 Roadmap

- [ ] Adicionar testes automáticos da API e alargar os testes unitários do front-end.
- [ ] Contentorizar a stack com Docker Compose (API + SPA + MongoDB).
- [ ] Publicar uma demo online.

## 👥 Autores

- **Maria Leonor Araújo** – [LinkedIn](https://www.linkedin.com/in/leonor-araújo-18155138b)
- **Miguel Ferreira** – [LinkedIn](https://www.linkedin.com/in/miguel-brand%C3%A3o-45a004427)
- **Marcelo Pinto**

## 📄 Licença

Projeto educativo – sem licença definida. Contacta os autores antes de reutilizar o código.
