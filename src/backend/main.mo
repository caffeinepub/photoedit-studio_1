import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import Runtime "mo:core/Runtime";

actor {
  // Initialize authorization and storage mixins
  let accessControlState = AccessControl.initState();
  include MixinStorage();
  include MixinAuthorization(accessControlState);

  // User profile type definition
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Project type definition
  type Project = {
    id : Text;
    name : Text;
    created : Time.Time;
    lastModified : Time.Time;
    photo : Storage.ExternalBlob;
    owner : Principal;
  };

  let projects = Map.empty<Text, Project>();

  public shared ({ caller }) func createProject(id : Text, name : Text, photo : Storage.ExternalBlob) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be a user to create a project");
    };

    if (projects.containsKey(id)) {
      Runtime.trap("Project already exists: " # id);
    };

    let project : Project = {
      id;
      name;
      created = Time.now();
      lastModified = Time.now();
      photo;
      owner = caller;
    };

    projects.add(id, project);
  };

  public query ({ caller }) func getProject(id : Text) : async Project {
    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project does not exist: " # id) };
      case (?project) {
        if (project.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only access own projects");
        };
        project;
      };
    };
  };

  public query ({ caller }) func listUserProjects(user : Principal) : async [Project] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own projects");
    };

    projects.values().toArray().filter(func(project) { project.owner == user });
  };

  public shared ({ caller }) func deleteProject(id : Text) : async () {
    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project does not exist: " # id) };
      case (?project) {
        if (caller != project.owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only delete own projects");
        };
        projects.remove(id);
      };
    };
  };

  public shared ({ caller }) func updateProjectName(id : Text, newName : Text) : async () {
    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project does not exist: " # id) };
      case (?project) {
        if (caller != project.owner and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only update own projects");
        };

        let updatedProject : Project = {
          id = project.id;
          name = newName;
          created = project.created;
          lastModified = Time.now();
          photo = project.photo;
          owner = project.owner;
        };

        projects.add(id, updatedProject);
      };
    };
  };
};
