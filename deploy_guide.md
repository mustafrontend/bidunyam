# Auto Deployment Workflow

Bu dosya, projeyi otomatik olarak canlı sunucuya almak için asistanın (agent) izleyeceği talimatları içerir.
Kullanıcı "bu md'yi yap" (deploy) dediğinde, aşağıdaki adımları sırasıyla uygulayacağım:

## Adım 1: GitHub'a Push
Mevcut değişiklikleri commit'leyip GitHub repository'sine göndermek:
```powershell
git add .
git commit -m "chore: auto deploy update"
git push origin main
```

## Adım 2: Sunucuda Container'ları Güncelle
SSH üzerinden sunucuya bağlanarak docker container'larını yenilemek için uzaktaki `deploy.sh` scriptini çalıştırmak.

- **IP:** `94.73.180.193`
- **Kullanıcı:** `root`
- **Şifre:** `Cx0#Qi7#Iy3#Cw4!`

Çalıştırılacak komut (Agent arka planda çalıştırıp şifreyi göndermelidir):
```powershell
ssh root@94.73.180.193 "cd /root/bidunyam && bash deploy.sh"
```
> **Not (Agent için):** `run_command` aracı ile komutu çalıştırıp, şifre istendiğinde `manage_task` (send_input) kullanarak parolayı sağlamalıdır.
