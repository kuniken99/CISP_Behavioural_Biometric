using System;
using System.Security.Cryptography;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace db_biometrics_mvp.Backend.Services
{
    public class BiometricEncryptionService
    {
        private readonly byte[] _key;
        private readonly byte[] _iv;

        public BiometricEncryptionService(IConfiguration configuration)
        {
            // Get encryption key and IV from configuration
            var encryptionKey = configuration["BiometricEncryption:Key"];
            var encryptionIV = configuration["BiometricEncryption:IV"];

            if (string.IsNullOrEmpty(encryptionKey) || string.IsNullOrEmpty(encryptionIV))
            {
                // Generate new key and IV if not configured
                using (var aes = Aes.Create())
                {
                    aes.KeySize = 256;
                    aes.GenerateKey();
                    aes.GenerateIV();
                    _key = aes.Key;
                    _iv = aes.IV;
                }
            }
            else
            {
                _key = Convert.FromBase64String(encryptionKey);
                _iv = Convert.FromBase64String(encryptionIV);
            }
        }

        public string EncryptBiometricData(string data)
        {
            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var encryptor = aes.CreateEncryptor();
            using var msEncrypt = new MemoryStream();
            using (var csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
            using (var swEncrypt = new StreamWriter(csEncrypt))
            {
                swEncrypt.Write(data);
            }

            var encrypted = msEncrypt.ToArray();
            return Convert.ToBase64String(encrypted);
        }

        public string DecryptBiometricData(string encryptedData)
        {
            var cipherBytes = Convert.FromBase64String(encryptedData);

            using var aes = Aes.Create();
            aes.Key = _key;
            aes.IV = _iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            using var decryptor = aes.CreateDecryptor();
            using var msDecrypt = new MemoryStream(cipherBytes);
            using var csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read);
            using var srDecrypt = new StreamReader(csDecrypt);
            
            return srDecrypt.ReadToEnd();
        }
    }
}