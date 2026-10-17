import sequelize from '../config/database.js';
import User from './User.js';
import TriagePatient from './TriagePatient.js';
import Queue from './Queue.js';
import Referral from './Referral.js';
import Facility from './Facility.js';

// Relasi antara Pasien Triase dengan Antrean (One-to-One)
TriagePatient.hasOne(Queue, {
  foreignKey: 'triage_patient_id',
  as: 'queue',
  onDelete: 'CASCADE',
});
Queue.belongsTo(TriagePatient, {
  foreignKey: 'triage_patient_id',
  as: 'patient',
});

// Relasi antara Pasien Triase dengan Rujukan (One-to-One)
TriagePatient.hasOne(Referral, {
  foreignKey: 'triage_patient_id',
  as: 'referral',
  onDelete: 'CASCADE',
});
Referral.belongsTo(TriagePatient, {
  foreignKey: 'triage_patient_id',
  as: 'patient',
});

// Relasi antara Antrean dengan Dokter (User) (Many-to-One)
User.hasMany(Queue, {
  foreignKey: 'dokter_id',
  as: 'queues',
});
Queue.belongsTo(User, {
  foreignKey: 'dokter_id',
  as: 'dokter',
});

// Relasi antara Faskes Mitra dengan Rujukan (One-to-Many)
Facility.hasMany(Referral, {
  foreignKey: 'facility_id',
  as: 'referrals',
});
Referral.belongsTo(Facility, {
  foreignKey: 'facility_id',
  as: 'facility',
});

export {
  sequelize,
  User,
  TriagePatient,
  Queue,
  Referral,
  Facility,
};

export default {
  sequelize,
  User,
  TriagePatient,
  Queue,
  Referral,
  Facility,
};

