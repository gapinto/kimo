# 🚀 Como Fazer Release do App (GitHub Actions)

## ✨ Configuração Automática

O GitHub Actions está configurado para buildar e publicar o APK automaticamente!

**Você não precisa:**
- ❌ Instalar Flutter
- ❌ Instalar Android Studio
- ❌ Buildar localmente

**O GitHub faz tudo! 🎉**

---

## 📦 Como Criar um Release

### Passo a Passo:

```bash
# 1. Ir para a pasta do projeto
cd ~/dev/kimo

# 2. Commitar mudanças (se houver)
git add .
git commit -m "feat: pronto para v1.0.0"

# 3. Criar tag de versão
git tag -a v1.0.0 -m "Versão 1.0.0 - Primeira versão pública"

# 4. Push da tag para o GitHub
git push origin v1.0.0

# 5. Aguardar ~5-10 minutos
# O GitHub Actions vai:
# ✅ Instalar Flutter
# ✅ Buildar APK
# ✅ Criar release
# ✅ Anexar APK automaticamente
```

---

## 🔍 Acompanhar o Build

1. Ir para: https://github.com/gapinto/kimo/actions
2. Ver workflow "Build and Release Flutter APK" rodando
3. Aguardar finalizar (ícone ✅ verde)

**Se der erro:**
- Clicar no workflow
- Ver logs
- Corrigir
- Deletar tag: `git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0`
- Criar tag novamente

---

## 📱 Resultado Final

Após o build concluir, o release estará em:

```
https://github.com/gapinto/kimo/releases/tag/v1.0.0
```

**O que vai ter:**
- 📄 Descrição do release
- 📦 Arquivo `KIMO-Overlay.apk` para download
- 📊 Estatísticas de downloads
- 💬 Espaço para comentários

---

## 🔗 Compartilhar com Usuários

### Link Direto para Download:

```
https://github.com/gapinto/kimo/releases/download/v1.0.0/KIMO-Overlay.apk
```

### Link da Página do Release:

```
https://github.com/gapinto/kimo/releases/tag/v1.0.0
```

### QR Code:

Pode gerar QR code do link em: https://qr-code-generator.com

---

## 🔄 Próximas Versões

### Corrigir bugs / Adicionar features:

```bash
# 1. Fazer as mudanças no código
git add .
git commit -m "fix: corrigir problema X"

# 2. Criar nova tag
git tag -a v1.0.1 -m "Versão 1.0.1 - Correção de bugs"

# 3. Push
git push origin v1.0.1

# 4. Novo release é criado automaticamente!
```

### Versão maior:

```bash
git tag -a v1.1.0 -m "Versão 1.1.0 - Novas funcionalidades"
git push origin v1.1.0
```

---

## 🎯 Versionamento Semântico

Use o padrão [SemVer](https://semver.org):

```
vX.Y.Z

X = Major (mudanças incompatíveis)
Y = Minor (novas funcionalidades)
Z = Patch (correções de bugs)

Exemplos:
v1.0.0 - Primeira versão
v1.0.1 - Correção de bug
v1.1.0 - Nova funcionalidade
v2.0.0 - Mudança grande
```

---

## 🐛 Troubleshooting

### "Permission denied to create release"

O GitHub precisa de permissão de escrita. Verificar em:
- Settings → Actions → General
- Workflow permissions → "Read and write permissions"

### "Flutter command not found"

Isso é no GitHub Actions, não na sua máquina. 
Verificar:
- `.github/workflows/release.yml` existe
- Flutter version está correta (3.16.0)

### "Build failed"

Ver logs em:
- Actions → Workflow failed → Ver detalhes
- Geralmente é:
  - Dependência faltando no `pubspec.yaml`
  - Erro de sintaxe no código Dart
  - Problema no `AndroidManifest.xml`

---

## 📊 Estatísticas

No release, você verá:
- 📥 Quantas vezes o APK foi baixado
- 👥 Quem baixou (se for público)
- 💬 Comentários dos usuários

---

## 🎉 Pronto!

Agora você tem um sistema de deploy automático!

**Fluxo completo:**
```
1. Código → Commit
2. Criar tag → git tag v1.0.0
3. Push → git push origin v1.0.0
4. GitHub Actions builda automaticamente
5. Release criado com APK
6. Compartilhar link
7. Usuários baixam e instalam
```

**Sem instalar nada na sua máquina!** 🚀

