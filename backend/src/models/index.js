import sequelize from '../config/database.js';
import User from './User.js';
import TriagePatient from './TriagePatient.js';
import Queue from './Queue.js';
import Referral from './Referral.js';

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

export {
  sequelize,
  User,
  TriagePatient,
  Queue,
  Referral,
};

export default {
  sequelize,
  User,
  TriagePatient,
  Queue,
  Referral,
};
