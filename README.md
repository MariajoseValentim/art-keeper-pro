# Art Keeper Pro

Plataforma profissional de curadoria digital para coleções privadas. Inspirada em museus internacionais, permite gerir peças, projetos museológicos, restauros, certificados, dossiês e pesquisa avançada, com auditoria completa e backups automáticos.



Código totalmente exportável. Projeto construído para ser independente da plataforma Lovable: base de dados na sua conta Supabase, sincronização GitHub ativa e sem dependências de funcionalidades proprietárias.



Índice

Funcionalidades

Stack tecnológica

Pré-requisitos

Setup local

Migrações e inicialização da base de dados

Variáveis de ambiente

Estrutura do projeto

Scripts disponíveis

Exportar o código

Exportar a base de dados

Implantação

Segurança e auditoria

Licença

Funcionalidades

Autenticação segura: login com email/password, Google OAuth e rate limiting anti-força bruta.

Dashboard: estatísticas da coleção, atividade recente e acesso rápido.

Gestão de coleção: ficha museológica completa por peça (título, autor, datas, materiais, dimensões, proveniência, estado, raridade, autenticidade, valor, etc.).

Fotografias ilimitadas: upload direto para storage privado, miniaturas e gestão por peça.

Categorias: classificação hierárquica das peças.

Projetos museológicos: agrupar peças em exposições, estudos ou restauros.

Restauros: histórico cronológico de intervenções por peça.

Certificados: emissão de certificados de autenticidade em PDF.

Dossiês em PDF: geração de fichas de catálogo, investigação e avaliação.

Pesquisa avançada: filtros combináveis por categoria, período, raridade, autenticidade, valor, estado, visibilidade e texto livre.

Área pública: partilha de peças individuais via slug público, com acesso anónimo controlado por RLS.

Auditoria: registo de todas as alterações e acessos, com exportação CSV/PDF.

Backups automáticos: exportação semanal de tabelas-chave para CSV, armazenada em bucket privado.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/79625631-86b2-4e40-8a51-fa8b18008077).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
