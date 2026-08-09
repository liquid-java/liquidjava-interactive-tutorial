/*
 * TUTORIAL CONTENT LIVES HERE
 * ---------------------------
 * Edit this file to change examples, prompts, checks, or quick-check questions.
 * The interface in app.js renders every lesson from this object automatically.
 *
 * Exercise checks are JavaScript regular expressions stored as strings. They are
 * intentionally tolerant of spacing so learners can format Java naturally.
 */
window.LIQUID_JAVA_TUTORIAL = {
  meta: {
    title: "LiquidJava Interactive Tutorial",
    eyebrow: "A hands-on interactive tutorial",
    introduction:
      "Learn how LiquidJava catches invalid values and illegal object behavior before a Java program runs.",
  },

  lessons: [
    {
      id: "values",
      number: "02",
      title: "Put boundaries on values",
      shortTitle: "Values",
      lead:
        "A regular Java type says “this is an integer.” A refinement can also limit that integer to the range expected by the program.",
      concept: {
        label: "Read the range",
        code: '@Refinement("_ >= 0 && _ <= 100") int battery;',
        explanation:
          "A battery percentage is an integer from 0 to 100. The refinement turns that domain rule into a compile-time contract.",
        notes: [
          "The underscore stands for the value being refined.",
          "Both endpoints are included because the contract uses >= and <=.",
          "LiquidJava reports an assignment outside the range before execution.",
        ],
      },
      exercise: {
        title: "Repair the red channel",
        prompt:
          "Add a refinement that limits red to 0–255, then replace the invalid value with any value that satisfies it.",
        starterCode: `import liquidjava.specification.Refinement;

public class RGB {
    public static void main(String[] args) {
        // Add the RGB channel refinement here
        int red = 300;
    }
}`,
        solutionCode: `import liquidjava.specification.Refinement;

public class RGB {
    public static void main(String[] args) {
        @Refinement("_ >= 0 && _ <= 255")
        int red = 220;
    }
}`,
        checks: [
          {
            pattern: "@Refinement\\s*\\(\\s*\"(?:(?:_|red)\\s*>=\\s*0\\s*&&\\s*(?:_|red)\\s*<=\\s*255|0\\s*<=\\s*(?:_|red)\\s*&&\\s*(?:_|red)\\s*<=\\s*255)\"\\s*\\)",
            message: "Add a boolean refinement that includes every integer from 0 to 255.",
          },
          {
            pattern: "int\\s+red\\s*=\\s*(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\s*;",
            message: "Choose a red-channel value between 0 and 255.",
          },
        ],
      },
      questions: [
        {
          id: "values-boundary",
          type: "radio",
          prompt: "Would the RGB refinement accept a red value of 255?",
          choices: ["Yes", "No"],
          correct: 0,
          explanation: "Yes. <= includes 255 itself.",
        },
        {
          id: "values-invalid",
          type: "radio",
          prompt: "Which assignment should LiquidJava reject?",
          choices: ["int red = 0;", "int red = 128;", "int red = 256;"],
          correct: 2,
          explanation: "256 is above the maximum RGB channel value of 255.",
        },
      ],
    },

    {
      id: "methods",
      number: "03",
      title: "Turn assumptions into contracts",
      shortTitle: "Methods",
      lead:
        "Method refinements describe which calls are valid and what the implementation promises about its result.",
      concept: {
        label: "Inputs and outputs",
        code: `@Refinement("_ == numerator / denominator")
public static int divide(
    int numerator,
    @Refinement("_ != 0") int denominator
) {
    return numerator / denominator;
}`,
        explanation:
          "The parameter contract prevents division by zero. The return contract connects the result to the two inputs.",
        notes: [
          "A parameter refinement constrains valid method calls.",
          "A refinement above the method describes its return value.",
          "LiquidJava checks the contract both at the call site and inside the implementation.",
        ],
      },
      exercise: {
        title: "Complete the midpoint contract",
        prompt:
          "Replace both true refinements: low must be no greater than high, and the return value must stay between the two bounds.",
        starterCode: `import liquidjava.specification.Refinement;

public class Midpoint {
    @Refinement("true")
    public static int midpoint(
        @Refinement("true") int low,
        int high
    ) {
        return low + (high - low) / 2;
    }
}`,
        solutionCode: `import liquidjava.specification.Refinement;

public class Midpoint {
    @Refinement("_ >= low && _ <= high")
    public static int midpoint(
        @Refinement("_ <= high") int low,
        int high
    ) {
        return low + (high - low) / 2;
    }
}`,
        checks: [
          {
            pattern: "@Refinement\\s*\\(\\s*\"(?:_\\s*>=\\s*low|low\\s*<=\\s*_)\\s*&&\\s*_\\s*<=\\s*high\"\\s*\\)\\s*public\\s+static\\s+int\\s+midpoint",
            message: "Refine the return value so it stays between low and high.",
          },
          {
            pattern: "@Refinement\\s*\\(\\s*\"_\\s*<=\\s*high\"\\s*\\)\\s*int\\s+low",
            message: "Require low to be less than or equal to high.",
          },
        ],
      },
      questions: [
        {
          id: "methods-call",
          type: "radio",
          prompt: "Which call should LiquidJava reject?",
          choices: ["midpoint(2, 8)", "midpoint(10, 10)", "midpoint(8, 2)"],
          correct: 2,
          explanation: "midpoint(8, 2) violates the requirement that low <= high.",
        },
        {
          id: "methods-implementation",
          type: "radio",
          prompt: "Which implementation would LiquidJava reject?",
          choices: ["return high + 1;", "return low;", "return high;"],
          correct: 0,
          explanation: "high + 1 is outside the return refinement’s allowed range of low through high.",
        },
      ],
    },

    {
      id: "states",
      number: "04",
      title: "Make object protocols explicit",
      shortTitle: "States",
      lead:
        "State refinements catch valid method calls made at the wrong time—a kind of bug ordinary Java types do not express.",
      concept: {
        label: "Follow the transition",
        code: `@StateSet({"off", "on"})
public class LightBulb {
    @StateRefinement(from="off(this)", to="on(this)")
    public void turnOn() { }
}`,
        explanation:
          "turnOn is valid only while the light bulb is off. After the call, LiquidJava knows that the same object is on.",
        notes: [
          "@StateSet declares every abstract state in the protocol.",
          "from describes the required state; to describes the state after the call.",
          "State names are predicates, so they include the receiver in parentheses.",
        ],
      },
      exercise: {
        title: "Complete the socket transitions",
        prompt:
          "Replace the true refinements so bind, connect, sendUrgentData, and close follow the socket protocol.",
        guide: {
          image: "images/socket_dfa.png",
          alt:
            "Socket protocol diagram. A socket starts unconnected; bind moves it to bound; connect moves it to connected; sendUrgentData keeps it connected; and close moves any non-closed socket to closed.",
          caption:
            "Follow each arrow from its source state to its target state. For the sendUrgentData loop, a from-only refinement requires connected and leaves the socket connected.",
        },
        starterCode: `import java.net.SocketAddress;
import liquidjava.specification.ExternalRefinementsFor;
import liquidjava.specification.StateRefinement;
import liquidjava.specification.StateSet;

@ExternalRefinementsFor("java.net.Socket")
@StateSet({"unconnected", "bound", "connected", "closed"})
public interface SocketRefinements {
    @StateRefinement(to="unconnected(this)")
    public void Socket();

    @StateRefinement(from="true", to="true")
    public void bind(SocketAddress add);

    @StateRefinement(from="true", to="true")
    public void connect(SocketAddress add);

    @StateRefinement(from="true")
    public void sendUrgentData(int n);

    @StateRefinement(from="true", to="true")
    public void close();
}`,
        solutionCode: `import java.net.SocketAddress;
import liquidjava.specification.ExternalRefinementsFor;
import liquidjava.specification.StateRefinement;
import liquidjava.specification.StateSet;

@ExternalRefinementsFor("java.net.Socket")
@StateSet({"unconnected", "bound", "connected", "closed"})
public interface SocketRefinements {
    @StateRefinement(to="unconnected(this)")
    public void Socket();

    @StateRefinement(from="unconnected(this)", to="bound(this)")
    public void bind(SocketAddress add);

    @StateRefinement(from="bound(this)", to="connected(this)")
    public void connect(SocketAddress add);

    @StateRefinement(from="connected(this)")
    public void sendUrgentData(int n);

    @StateRefinement(from="!closed(this)", to="closed(this)")
    public void close();
}`,
        checks: [
          {
            pattern: "@StateRefinement\\s*\\(\\s*from\\s*=\\s*\"unconnected\\(this\\)\"\\s*,\\s*to\\s*=\\s*\"bound\\(this\\)\"\\s*\\)\\s*public\\s+void\\s+bind",
            message: "bind should move the socket from unconnected to bound.",
          },
          {
            pattern: "@StateRefinement\\s*\\(\\s*from\\s*=\\s*\"bound\\(this\\)\"\\s*,\\s*to\\s*=\\s*\"connected\\(this\\)\"\\s*\\)\\s*public\\s+void\\s+connect",
            message: "connect should move the socket from bound to connected.",
          },
          {
            pattern: "@StateRefinement\\s*\\(\\s*from\\s*=\\s*\"connected\\(this\\)\"\\s*(?:,\\s*to\\s*=\\s*\"connected\\(this\\)\"\\s*)?\\)\\s*public\\s+void\\s+sendUrgentData",
            message: "sendUrgentData should require a connected socket and leave it connected.",
          },
          {
            pattern: "@StateRefinement\\s*\\(\\s*from\\s*=\\s*\"!closed\\(this\\)\"\\s*,\\s*to\\s*=\\s*\"closed\\(this\\)\"\\s*\\)\\s*public\\s+void\\s+close",
            message: "close should accept any non-closed socket and leave it closed.",
          },
        ],
      },
      questions: [
        {
          id: "states-initial",
          type: "radio",
          prompt: "What state does the Socket constructor establish?",
          choices: ["unconnected", "bound", "connected", "closed"],
          correct: 0,
          explanation: "The constructor’s to refinement establishes unconnected(this).",
        },
        {
          id: "states-sequence",
          type: "radio",
          prompt: "Which sequence follows the protocol?",
          choices: [
            "Socket(); bind(); connect(); sendUrgentData(1); close();",
            "Socket(); connect(); bind();",
            "Socket(); bind(); bind();",
          ],
          correct: 0,
          explanation:
            "After bind and connect, sendUrgentData is allowed and leaves the socket connected, so close is still valid.",
        },
      ],
    },

    {
      id: "ghosts",
      number: "05",
      title: "Track properties with ghost variables",
      shortTitle: "Ghosts",
      lead:
        "Ghost variables track abstract information for verification without adding runtime state to the underlying Java object.",
      concept: {
        label: "Track an abstract value",
        code: `@ExternalRefinementsFor("java.util.ArrayList")
@Ghost("int size")
public interface ArrayListRefinements<E> {
    @StateRefinement(to="size(this) == size(old(this)) + 1")
    public boolean add(E element);
}`,
        explanation:
          "The ghost variable size records how many elements an ArrayList contains. add relates the new size to the old size.",
        notes: [
          "Ghost state exists for verification; it is not a runtime field.",
          "old(this) refers to the object state before the method call.",
          "Other refinements can use the ghost value to prevent out-of-bounds access.",
        ],
      },
      exercise: {
        title: "Complete the stack refinements",
        prompt:
          "Replace the true refinements so the constructor, push, pop, and peek maintain and check the size ghost variable.",
        starterCode: `import liquidjava.specification.ExternalRefinementsFor;
import liquidjava.specification.Ghost;
import liquidjava.specification.StateRefinement;

@ExternalRefinementsFor("java.util.Stack")
@Ghost("int size")
public interface StackRefinements<E> {
    @StateRefinement(to="true")
    public void Stack();

    @StateRefinement(to="true")
    public E push(E elem);

    @StateRefinement(from="true", to="true")
    public E pop();

    @StateRefinement(from="true")
    public E peek();
}`,
        solutionCode: `import liquidjava.specification.ExternalRefinementsFor;
import liquidjava.specification.Ghost;
import liquidjava.specification.StateRefinement;

@ExternalRefinementsFor("java.util.Stack")
@Ghost("int size")
public interface StackRefinements<E> {
    @StateRefinement(to="size(this) == 0")
    public void Stack();

    @StateRefinement(to="size(this) == size(old(this)) + 1")
    public E push(E elem);

    @StateRefinement(from="size(this) > 0", to="size(this) == size(old(this)) - 1")
    public E pop();

    @StateRefinement(from="size(this) > 0")
    public E peek();
}`,
        checks: [
          {
            pattern: "@StateRefinement\\s*\\(\\s*to\\s*=\\s*\"size\\(this\\)\\s*==\\s*0\"\\s*\\)\\s*public\\s+void\\s+Stack",
            message: "The constructor should initialize size(this) to 0.",
          },
          {
            pattern: "@StateRefinement\\s*\\(\\s*to\\s*=\\s*\"size\\(this\\)\\s*==\\s*size\\(old\\(this\\)\\)\\s*\\+\\s*1\"\\s*\\)\\s*public\\s+E\\s+push",
            message: "push should increase the previous size by one.",
          },
          {
            pattern: "@StateRefinement\\s*\\(\\s*from\\s*=\\s*\"size\\(this\\)\\s*>\\s*0\"\\s*,\\s*to\\s*=\\s*\"size\\(this\\)\\s*==\\s*size\\(old\\(this\\)\\)\\s*-\\s*1\"\\s*\\)\\s*public\\s+E\\s+pop",
            message: "pop should require a non-empty stack and decrease size by one.",
          },
          {
            pattern: "@StateRefinement\\s*\\(\\s*from\\s*=\\s*\"size\\(this\\)\\s*>\\s*0\"\\s*\\)\\s*public\\s+E\\s+peek",
            message: "peek should require size(this) to be greater than zero.",
          },
        ],
      },
      questions: [
        {
          id: "ghosts-size",
          type: "text",
          prompt: "Starting from an empty stack, what is size after push(), push(), pop()?",
          placeholder: "Enter an integer",
          inputMode: "numeric",
          accepted: ["1"],
          explanation: "The two pushes increase size to 2, and pop decreases it to 1.",
        },
        {
          id: "ghosts-empty",
          type: "radio",
          prompt: "Which operations are rejected when size(this) == 0?",
          choices: ["push() only", "pop() and peek()", "The constructor only"],
          correct: 1,
          explanation: "Both pop and peek require size(this) > 0.",
        },
      ],
    },
  ],
};
