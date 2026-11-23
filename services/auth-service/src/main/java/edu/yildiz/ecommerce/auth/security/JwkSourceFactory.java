package edu.yildiz.ecommerce.auth.security;

import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.UUID;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import edu.yildiz.ecommerce.auth.config.AuthProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/** Builds the key that signs the tokens. */
final class JwkSourceFactory {

    private static final Logger log = LoggerFactory.getLogger(JwkSourceFactory.class);

    private JwkSourceFactory() {
    }

    /**
     * Uses the configured key pair. Without one a temporary key is generated: tokens then stop being valid when
     * the service restarts, which is acceptable on a developer machine only.
     */
    static JWKSource<SecurityContext> create(AuthProperties properties) {
        RSAKey key = hasConfiguredKey(properties) ? configuredKey(properties) : temporaryKey();
        return new ImmutableJWKSet<>(new JWKSet(key));
    }

    private static boolean hasConfiguredKey(AuthProperties properties) {
        return properties.jwtPrivateKey() != null && !properties.jwtPrivateKey().isBlank()
                && properties.jwtPublicKey() != null && !properties.jwtPublicKey().isBlank();
    }

    private static RSAKey configuredKey(AuthProperties properties) {
        try {
            KeyFactory factory = KeyFactory.getInstance("RSA");
            RSAPrivateKey privateKey = (RSAPrivateKey) factory.generatePrivate(
                    new PKCS8EncodedKeySpec(Base64.getMimeDecoder().decode(properties.jwtPrivateKey())));
            RSAPublicKey publicKey = (RSAPublicKey) factory.generatePublic(
                    new X509EncodedKeySpec(Base64.getMimeDecoder().decode(properties.jwtPublicKey())));
            return new RSAKey.Builder(publicKey).privateKey(privateKey).keyID("dwh-signing-key").build();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException | IllegalArgumentException e) {
            throw new IllegalStateException("The configured JWT key pair could not be read", e);
        }
    }

    private static RSAKey temporaryKey() {
        log.warn("No JWT key pair is configured, generating a temporary one. Tokens will not survive a restart.");
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            KeyPair pair = generator.generateKeyPair();
            return new RSAKey.Builder((RSAPublicKey) pair.getPublic())
                    .privateKey((RSAPrivateKey) pair.getPrivate())
                    .keyID(UUID.randomUUID().toString())
                    .build();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("RSA is not available", e);
        }
    }
}
