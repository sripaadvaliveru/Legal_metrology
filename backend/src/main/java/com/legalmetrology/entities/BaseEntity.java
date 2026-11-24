package com.legalmetrology.entities;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.legalmetrology.services.IdGenerator;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;

/**
 * Base class for every entity in the system.
 *
 * <p>All twenty entities declare their own {@code id} field (Lombok generates its accessor), so the
 * ID is assigned here in a single place rather than repeated twenty times. {@code @MappedSuperclass}
 * is what makes JPA inherit this lifecycle callback into every subclass.</p>
 *
 * <p>Reflection is used deliberately: the {@code id} field must stay declared on each entity so that
 * Lombok's {@code @Builder} still exposes {@code .id(...)} — which is how applications, instruments
 * and certificates take their primary key straight from their existing business number. Declaring an
 * abstract {@code getId()} on this class instead would make Lombok skip generation and fail compilation.</p>
 */
@MappedSuperclass
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public abstract class BaseEntity {

    /**
     * Runs immediately before every INSERT. Entities that already know their ID — applications
     * ({@code APP-2026-000011}), certificates ({@code CERT-LM-2026-000001}) and instruments
     * ({@code USR-2026-01-INST-0001}) — set it explicitly and are left untouched here.
     */
    @PrePersist
    protected void assignNomenclatureId() {
        try {
            if (getClass().getMethod("getId").invoke(this) != null) {
                return;
            }
            getClass().getMethod("setId", String.class).invoke(this, IdGenerator.next(this));
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(
                    "Could not assign a nomenclature ID to " + getClass().getSimpleName()
                            + " — the entity must expose getId()/setId(String)", e);
        }
    }
}
