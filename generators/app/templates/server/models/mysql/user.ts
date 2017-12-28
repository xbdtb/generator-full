export default (sequelize, DataTypes) => {
  const Model = sequelize.define(
    'User',
    {
      username: {
        comment: 'user name',
        type: DataTypes.STRING
      },
      nickname: {
        comment: 'nick name',
        type: DataTypes.STRING
      },
      password: {
        comment: 'password',
        type: DataTypes.STRING
      },
      state: {
        comment: 'user state',
        type: DataTypes.INTEGER
      }
    },
    {
      indexes: [
        {
          fields: ['username']
        },
        {
          fields: ['nickname']
        }
      ],
      freezeTableName: true,
      paranoid: true
    }
  );

  Model.comment = '';
  Model.associate = models => {
  };
  return Model;
};
