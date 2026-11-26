package com.legalmetrology.services;

import com.legalmetrology.entities.Application;
import com.legalmetrology.entities.Assignment;
import com.legalmetrology.entities.Establishment;
import com.legalmetrology.entities.Instrument;
import com.legalmetrology.entities.InstrumentType;
import com.legalmetrology.entities.Jurisdiction;
import com.legalmetrology.entities.User;
import com.legalmetrology.enums.ApplicationStatus;
import com.legalmetrology.enums.ApplicationType;
import com.legalmetrology.enums.AssignmentMethod;
import com.legalmetrology.enums.Role;
import com.legalmetrology.repositories.ApplicationRepository;
import com.legalmetrology.repositories.AssignmentRepository;
import com.legalmetrology.repositories.AuditLogRepository;
import com.legalmetrology.repositories.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.nullable;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceTest {

    @Mock private AssignmentRepository assignmentRepository;
    @Mock private ApplicationRepository applicationRepository;
    @Mock private UserRepository userRepository;
    @Mock private AuditLogRepository auditLogRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks private AssignmentService assignmentService;

    @Test
    void autoAssignChoosesCandidateInTheCorrectJurisdictionWithMatchingCompetency() {
        Jurisdiction east = Jurisdiction.builder().id("J-EAST").name("East").build();
        Jurisdiction west = Jurisdiction.builder().id("J-WEST").name("West").build();
        InstrumentType weighing = InstrumentType.builder().id("T-WEIGH").name("Weighing scale").build();

        Application application = Application.builder()
                .id("A-1")
                .applicationNumber("APP-001")
                .type(ApplicationType.INITIAL_VERIFICATION)
                .status(ApplicationStatus.SUBMITTED)
                .applicant(User.builder().id("B-1").email("business@example.com").build())
                .instrument(Instrument.builder()
                        .instrumentType(weighing)
                        .establishment(Establishment.builder().jurisdiction(east).build())
                        .build())
                .build();

        User wrongJurisdiction = User.builder().id("U-1").email("lmo-west@example.com")
                .role(Role.LMO).isActive(true).jurisdictionId(west.getId()).competency(weighing).build();
        User best = User.builder().id("U-2").email("lmo-east@example.com")
                .role(Role.LMO).isActive(true).jurisdictionId(east.getId()).competency(weighing).build();

        when(applicationRepository.findById("A-1")).thenReturn(Optional.of(application));
        when(userRepository.findAll()).thenReturn(List.of(wrongJurisdiction, best));
        when(assignmentRepository.findByAssigneeId(anyString())).thenReturn(List.of());
        when(assignmentRepository.save(any(Assignment.class))).thenAnswer(inv -> inv.getArgument(0));

        Assignment result = assignmentService.autoAssign("A-1");

        assertEquals(best.getId(), result.getAssignee().getId());
        assertEquals(AssignmentMethod.AUTO, result.getMethod());
        assertTrue(result.getScore() > 0.5);
        assertEquals(ApplicationStatus.ASSIGNED, application.getStatus());
        verify(auditLogRepository).save(any());
        verify(notificationService, times(2)).createNotificationByEmail(anyString(), anyString(),
                anyString(), anyString(), nullable(String.class));
    }

    @Test
    void autoAssignFailsWhenNoActiveLmoExists() {
        Application application = Application.builder().id("A-2").build();
        when(applicationRepository.findById("A-2")).thenReturn(Optional.of(application));
        when(userRepository.findAll()).thenReturn(List.of());

        assertThrows(RuntimeException.class, () -> assignmentService.autoAssign("A-2"));
        verifyNoInteractions(assignmentRepository);
    }

    @Test
    void reassignKeepsAuditRelevantFields() {
        User oldAssignee = User.builder().id("U-1").email("old@example.com").build();
        User newAssignee = User.builder().id("U-2").email("new@example.com").build();
        Assignment existing = Assignment.builder()
                .id("AS-1").assignee(oldAssignee).method(AssignmentMethod.AUTO).build();

        when(assignmentRepository.findById("AS-1")).thenReturn(Optional.of(existing));
        when(userRepository.findById("U-2")).thenReturn(Optional.of(newAssignee));
        when(assignmentRepository.save(any(Assignment.class))).thenAnswer(inv -> inv.getArgument(0));

        Assignment result = assignmentService.reassign("AS-1", "U-2", "Officer unavailable", "admin@example.com");

        assertEquals("U-1", result.getPreviousAssigneeId());
        assertEquals("U-2", result.getAssignee().getId());
        assertEquals(AssignmentMethod.REASSIGNED, result.getMethod());
        assertEquals("Officer unavailable", result.getReason());

        ArgumentCaptor<Assignment> captor = ArgumentCaptor.forClass(Assignment.class);
        verify(assignmentRepository).save(captor.capture());
        assertSame(existing, captor.getValue());
    }
}
