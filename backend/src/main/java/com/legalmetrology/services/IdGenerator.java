package com.legalmetrology.services;

import com.legalmetrology.entities.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Central source of truth for every human-readable (nomenclature) ID in the system.
 *
 * <p>The codebase already had three separate ad-hoc counters for {@code APP-}, {@code LM-INST-}
 * and {@code CERT-LM-} numbers, each an {@link AtomicLong} with its own copy of the same
 * seed-from-MAX logic. This class replaces all of them with a single rule so that no ID in the
 * system is ever a random UUID again.</p>
 *
 * <h2>Formats</h2>
 * <pre>
 *   PREFIX-&lt;YYYY&gt;-&lt;NNNNNN&gt;            CMP-2026-000001, ASG-2026-000001, APP-2026-000011
 *   USR-&lt;YYYY&gt;-&lt;NN&gt;                    USR-2026-01      (user sequence: min 2 digits, grows
 *                                                            naturally so instrument IDs stay short)
 *   JUR-&lt;jurisdiction_code&gt;             JUR-HYD-EAST
 *   &lt;user id&gt;-INST-&lt;NNNN&gt;              USR-2026-01-INST-0001   (instruments only)
 * </pre>
 *
 * <h2>Seeding</h2>
 * Counters are seeded lazily, on first use, by scanning the existing IDs of the target table and
 * taking the highest sequence for the <em>current</em> year. Lazy seeding makes startup order
 * irrelevant: {@code data.sql} (which runs after JPA schema init, {@code defer-datasource-initialization})
 * has always already run by the time the first request persists an entity. Re-seeding from the
 * database on every restart also means gaps left by deleted rows are never reused.
 *
 * <p>{@code certificates.qr_token} is deliberately <b>not</b> migrated to this scheme: it is read by
 * the unauthenticated {@code GET /api/public/verify/{token}} endpoint, so a sequential value there
 * would let anyone enumerate every certificate.</p>
 */
@Component
public class IdGenerator {

    private static final Map<String, AtomicLong> COUNTERS = new ConcurrentHashMap<>();

    private static final Map<Class<?>, Spec> SPECS = new HashMap<>();

    static {
        SPECS.put(User.class, new Spec("USR", "users", 2));
        SPECS.put(InstrumentType.class, new Spec("CMP", "instrument_types", 6));
        SPECS.put(Jurisdiction.class, new Spec("JUR", "jurisdictions", 6));
        SPECS.put(Assignment.class, new Spec("ASG", "assignments", 6));
        SPECS.put(Appointment.class, new Spec("APT", "appointments", 6));
        SPECS.put(Inspection.class, new Spec("INS", "inspections", 6));
        SPECS.put(Business.class, new Spec("BIZ", "businesses", 6));
        SPECS.put(Establishment.class, new Spec("EST", "establishments", 6));
        SPECS.put(ChecklistTemplate.class, new Spec("CHK", "checklist_templates", 6));
        SPECS.put(VerificationRule.class, new Spec("VRU", "verification_rules", 6));
        SPECS.put(Complaint.class, new Spec("CMB", "complaints", 6));
        SPECS.put(Notification.class, new Spec("NTF", "notifications", 6));
        SPECS.put(AuditLog.class, new Spec("AUD", "audit_logs", 6));
        SPECS.put(Measurement.class, new Spec("MSR", "measurements", 6));
        SPECS.put(Violation.class, new Spec("VLN", "violations", 6));
        SPECS.put(Equipment.class, new Spec("EQP", "equipment", 6));
        SPECS.put(ApplicationStatusHistory.class, new Spec("ASH", "application_status_history", 6));
        // Applications and certificates carry their own business number, which IS the primary key.
        SPECS.put(Application.class, new Spec("APP", "applications", 6));
        SPECS.put(Certificate.class, new Spec("CERT-LM", "certificates", 6));
    }

    /** Set once by the constructor; the generator is otherwise entirely static so entities can call it. */
    private static JdbcTemplate jdbc;

    public IdGenerator(JdbcTemplate jdbc) {
        IdGenerator.jdbc = jdbc;
    }

    /**
     * Generates the next ID for a freshly built entity (called from {@code BaseEntity @PrePersist}).
     */
    public static String next(Object entity) {
        if (entity instanceof Jurisdiction jurisdiction && jurisdiction.getJurisdictionCode() != null) {
            // Jurisdictions are seeded, never created at runtime, and are identified by their
            // human-readable code rather than a sequence: JUR-HYD-EAST, JUR-CYB.
            return "JUR-" + jurisdiction.getJurisdictionCode();
        }
        if (entity instanceof Instrument instrument) {
            return nextInstrument(resolveOwnerUserId(instrument));
        }
        return next(entity.getClass());
    }

    /**
     * Generates the next ID for an entity type without an instance — used where a business number
     * must be computed before the entity exists (application number, certificate number).
     */
    public static String next(Class<?> entityType) {
        Spec spec = SPECS.get(entityType);
        if (spec == null) {
            throw new IllegalStateException("No ID rule registered for " + entityType.getName());
        }
        long seq = counter(spec).getAndIncrement();
        return spec.prefix() + "-" + Year.now().getValue() + "-" + pad(seq, spec.minDigits());
    }

    /**
     * Instrument IDs are derived from their owner: {@code USR-2026-01-INST-0001}. The sequence is
     * per-owner, so each business counts its own instruments from 0001.
     */
    public static String nextInstrument(String ownerUserId) {
        String prefix = ownerUserId + "-INST-";
        long max = 0;
        for (String id : jdbc().queryForList("SELECT id FROM instruments", String.class)) {
            if (id == null || !id.startsWith(prefix)) continue;
            try {
                max = Math.max(max, Long.parseLong(id.substring(prefix.length())));
            } catch (NumberFormatException ignored) {
                // not one of ours (e.g. a legacy LM-INST-... row) — skip
            }
        }
        return prefix + String.format("%04d", max + 1);
    }

    /**
     * Safety net for the (never-hit in practice) case where an instrument is persisted without its
     * ID having been set explicitly by {@link InstrumentService}. Walks
     * establishment -&gt; business -&gt; user, which is the only ownership path the schema has.
     */
    private static String resolveOwnerUserId(Instrument instrument) {
        if (instrument.getEstablishment() == null || instrument.getEstablishment().getId() == null) {
            return "ORG";
        }
        List<String> owners = jdbc().queryForList(
                "SELECT u.id FROM establishments e "
                        + "JOIN businesses b ON e.business_id = b.id "
                        + "JOIN users u ON u.business_id = b.id "
                        + "WHERE e.id = ? ORDER BY u.created_at, u.id LIMIT 1",
                String.class, instrument.getEstablishment().getId());
        return owners.isEmpty() ? "ORG" : owners.get(0);
    }

    private static AtomicLong counter(Spec spec) {
        return COUNTERS.computeIfAbsent(spec.table(), table -> seed(spec));
    }

    /**
     * Reads the highest sequence already present for the current year and continues from there.
     * Deliberately ignores anything that does not match {@code PREFIX-YYYY-NNNNNN}, so legacy UUID
     * rows (before migration) simply do not participate.
     */
    private static AtomicLong seed(Spec spec) {
        String year = String.valueOf(Year.now().getValue());
        long max = 0;
        for (String id : jdbc().queryForList("SELECT id FROM " + spec.table(), String.class)) {
            if (id == null) continue;
            int tailDash = id.lastIndexOf('-');
            if (tailDash < 0) continue;
            int yearDash = id.lastIndexOf('-', tailDash - 1);
            if (yearDash < 0) continue;
            if (!year.equals(id.substring(yearDash + 1, tailDash))) continue;
            try {
                max = Math.max(max, Long.parseLong(id.substring(tailDash + 1)));
            } catch (NumberFormatException ignored) {
                // not a sequence number for this prefix
            }
        }
        return new AtomicLong(max + 1);
    }

    /** Zero-pads to {@code minDigits} but never truncates, so the ID simply grows when it earns the digit. */
    private static String pad(long value, int minDigits) {
        return String.format("%0" + minDigits + "d", value);
    }

    private static JdbcTemplate jdbc() {
        if (jdbc == null) {
            throw new IllegalStateException("IdGenerator has not been initialised by Spring");
        }
        return jdbc;
    }

    private record Spec(String prefix, String table, int minDigits) {
    }
}
